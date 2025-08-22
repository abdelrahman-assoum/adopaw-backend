// middlewares/supabaseAuth.js
const jwt = require("jsonwebtoken");
const { getDb } = require("../realtime/utilsDb");

// Use the exact same secret Supabase uses (anon/service key secret)
const SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_HS_SECRET;
const AUTO_CREATE = process.env.AUTO_CREATE_PROFILE === "1";

module.exports = async function supabaseAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return res.status(401).json({ error: "missing token" });

    const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] });

    const uid   = decoded.sub; // Supabase user UUID
    const email = (decoded.email || decoded.user_metadata?.email || "").toLowerCase();
    const name  = decoded.user_metadata?.name || "";

    if (!uid) return res.status(401).json({ error: "invalid token (no sub)" });

    const db = await getDb();

    // 🔑 Your schema uses "supaId" (not "supabaseId")
    let profile =
      await db.collection("profiles").findOne({ supaId: uid }) ||
      (email ? await db.collection("profiles").findOne({ email }) : null);

    if (!profile) {
      if (!AUTO_CREATE) {
        return res.status(401).json({ error: "profile not found for uid" });
      }
      const ins = await db.collection("profiles").insertOne({
        supaId: uid,
        email: email || `user-${uid}@example.com`,
        name,
        avatarUrl: "",
        bio: "",
        phone: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      profile = { _id: ins.insertedId, supaId: uid, email, name };
    }

    req.user = {
      id: String(profile._id),   // Mongo ObjectId string — used by chat routes
      supabaseId: uid,
      email,
      claims: decoded,
    };

    next();
  } catch (e) {
    res.status(401).json({ error: "unauthorized", detail: e.message });
  }
};
