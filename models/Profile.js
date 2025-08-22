// middlewares/supabaseAuth.js
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');

const SECRET = process.env.JWT_HS_SECRET || process.env.SUPABASE_JWT_SECRET;

module.exports = async function supabaseAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'missing token' });

    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    const uid = decoded.sub; // Supabase user id (UUID)
    const email = decoded.email || decoded.user_metadata?.email || null;
    if (!uid) return res.status(401).json({ error: 'invalid token (no sub)' });

    // 🔧 match your schema: Profile.supaId
    let profile =
      await Profile.findOne({ supaId: uid }) ||
      (email ? await Profile.findOne({ email }) : null);

    if (!profile) return res.status(401).json({ error: 'profile not found for uid' });

    req.user = {
      id: String(profile._id),  // IMPORTANT: Profile ObjectId as string
      supabaseId: uid,
      email,
      claims: decoded,
    };
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
};
