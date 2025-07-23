import jwt from "jsonwebtoken";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export function verifySupabaseToken(token) {
  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const user = verifySupabaseToken(token);
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized: " + err.message });
  }
};

module.exports = authenticate;
