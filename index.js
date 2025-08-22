require('dotenv').config();
const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db');

const profileRoutes = require('./routes/profileRoute');
const petRoutes = require('./routes/petRoute');
const commentRoutes = require('./routes/commentRoute');

// 👇 add this to debug auth quickly
const supabaseAuth = require('./middlewares/supabaseAuth');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/health', (_, res) => res.send('ok'));
app.get('/', (req, res) => res.send('API is running...'));

// App feature routes
app.use('/profile', profileRoutes);
app.use('/pet', petRoutes);
app.use('/comment', commentRoutes);

// --- API prefix
const chatApiPrefix = process.env.CHAT_API_PREFIX || '/chat-api';

// ✅ Mount USER-TO-USER CHAT REST *once* here
app.use(chatApiPrefix, require('./routes/chatRealtimeRoute'));
// Optional: quick whoami to verify auth mapping
app.get(`${chatApiPrefix}/debug/whoami`, supabaseAuth, (req, res) => res.json(req.user));

// ✅ PAWLO (assistant/LLM) under /chat
app.use('/chat', require('./routes/pawloRoute'));

// >>> Realtime bootstrap (sockets only — DO NOT mount routes there)
const { bootstrapRealtime } = require('./realtime/bootstrap');
const { server } = bootstrapRealtime(app);

const PORT = process.env.PORT || 5000;
if (server) {
  server.listen(PORT, () => console.log('API+WS on', PORT));
} else {
  app.listen(PORT, () => console.log('API on', PORT));
}
