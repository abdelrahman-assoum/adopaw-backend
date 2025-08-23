// realtime/bootstrap.js
const http = require("http");
const { Server } = require("socket.io");
const { socketAuth } = require("./socketAuth");
const registerSocket = require("./socket");
const { wireStreams } = require("./streams");
const chatRealtimeRoute = require("../routes/chatRealtimeRoute");

module.exports.bootstrapRealtime = function bootstrapRealtime(app) {
  if (process.env.ENABLE_CHAT !== "1") return { server: null, io: null };

  const prefix = process.env.CHAT_API_PREFIX || "/chat-api";
  app.use(prefix, chatRealtimeRoute);

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  socketAuth(io);
  registerSocket(io);
  wireStreams(io).catch(console.error); // <-- important

  return { server, io };
};
