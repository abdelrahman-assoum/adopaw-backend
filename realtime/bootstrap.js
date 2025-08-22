const http = require('http');
const { Server } = require('socket.io');
const { socketAuth } = require('./socketAuth');
const registerSocket = require('./socket');
const { wireStreams } = require('./streams');

module.exports.bootstrapRealtime = function bootstrapRealtime(app) {
  if (process.env.ENABLE_CHAT !== '1') return { server: null, io: null };

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  // Make io available to routes via req.app.get('io')
  app.set('io', io);

  socketAuth(io);
  registerSocket(io);
  wireStreams(io).catch(console.error);

  return { server, io };
};
