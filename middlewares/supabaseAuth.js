// middlewares/supabaseAuth.js
const jwt = require("jsonwebtoken");
const Profile = require("../models/Profile");

const SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_HS_SECRET;
const AUTO_CREATE = process.env.AUTO_CREATE_PROFILE === "1";

module.exports = async function supabaseAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return res.status(401).json({ error: "missing token" });

    const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
    const uid = decoded.sub;
    const email = (
      decoded.email ||
      decoded.user_metadata?.email ||
      ""
    ).toLowerCase();
    const name = decoded.user_metadata?.name || "";

    if (!uid) return res.status(401).json({ error: "invalid token (no sub)" });

    // Use Mongoose's findOne
    let profile =
      (await Profile.findOne({ supaId: uid })) ||
      (email ? await Profile.findOne({ email }) : null);

    if (!profile) {
      if (!AUTO_CREATE) {
        return res.status(401).json({ error: "profile not found for uid" });
      }

      profile = await Profile.create({
        supaId: uid,
        email: email || `user-${uid}@example.com`,
        name,
        avatarUrl: "",
        bio: "",
        phone: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    req.user = {
      id: String(profile._id),
      supabaseId: uid,
      email,
      claims: decoded,
    };

    next();
  } catch (e) {
    console.log(e);
    res.status(501).json({ error: "unauthorized", detail: e.message });
  }
};
