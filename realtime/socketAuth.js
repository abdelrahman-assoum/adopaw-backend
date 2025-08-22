// realtime/socketAuth.js
const jwt = require("jsonwebtoken");
const { getDb } = require("./utilsDb");

const SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_HS_SECRET;

module.exports.socketAuth = function socketAuth(io) {
  io.use(async (socket, next) => {
    try {
      const tok = socket.handshake.auth?.token || "";
      const dec = jwt.verify(tok, SECRET, { algorithms: ["HS256"] });

      const uid   = dec.sub;
      const email = (dec.email || dec.user_metadata?.email || "").toLowerCase();
      if (!uid) return next(new Error("unauthorized"));

      const db = await getDb();
      let profile =
        await db.collection("profiles").findOne({ supaId: uid }) ||
        (email ? await db.collection("profiles").findOne({ email }) : null);

      if (!profile) return next(new Error("unauthorized"));

      socket.userId = String(profile._id); // required by socket handlers
      next();
    } catch (_e) {
      next(new Error("unauthorized"));
    }
  });
};
