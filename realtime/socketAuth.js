const jwt = require('jsonwebtoken');

function verifyToken(token) {
  const mode = process.env.JWT_MODE || 'HS256';
  if (mode === 'RS256') {
    return jwt.verify(token, process.env.JWT_PUBLIC_KEY, { algorithms: ['RS256'] });
  }
  const secret = process.env.JWT_HS_SECRET || process.env.SUPABASE_JWT_SECRET;
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

module.exports.socketAuth = function socketAuth(io) {
  io.use((socket, next) => {
    try {
      const tok = socket.handshake.auth?.token || '';
      socket.userId = verifyToken(tok).sub;
      next();
    } catch (e) {
      next(new Error('unauthorized'));
    }
  });
};
