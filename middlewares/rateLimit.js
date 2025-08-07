// middlewares/rateLimit.js
let last = 0;
module.exports = (req, res, next) => {
  if (Date.now() - last < 1000) {
    return res.status(429).json({ error: 'Too many requests—please wait.' });
  }
  last = Date.now();
  next();
};
