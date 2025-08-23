// realtime/socketAuth.js
const jwt = require("jsonwebtoken");
const { getDb } = require("./utilsDb");

function verifyToken(token) {
  const mode = process.env.JWT_MODE || "HS256";
  if (mode === "RS256") {
    return jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
      algorithms: ["RS256"],
    });
  }
  const secret = process.env.JWT_HS_SECRET || process.env.SUPABASE_JWT_SECRET;
  return jwt.verify(token, secret, { algorithms: ["HS256"] });
}

module.exports.socketAuth = function socketAuth(io) {
  io.use(async (socket, next) => {
    try {
      const tok = socket.handshake.auth?.token || "";
      if (!tok) return next(new Error("unauthorized"));
      const payload = verifyToken(tok);

      // Map Supabase UUID (payload.sub) -> Mongo profile._id
      const db = await getDb();
      const supaId = String(payload.sub || "");
      const profile = await db
        .collection("profiles")
        .findOne({ supaId }, { projection: { _id: 1 } });

      if (!profile?._id) {
        console.error("[ws-auth] profile not found for sub", supaId);
        return next(new Error("unauthorized"));
      }

      socket.userId = String(profile._id); // <- Mongo ObjectId as string
      return next();
    } catch (e) {
      console.error("[ws-auth] fail", e.message);
      return next(new Error("unauthorized"));
    }
  });
};
