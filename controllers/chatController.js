// controllers/chatController.js
const { getChatReply } = require('../services/chatService');

exports.chat = async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    // load history from DB by sessionId
    const history = [];
    const reply   = await getChatReply(message, history);
    return res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    return res.json({ reply: 'Our assistant is resting—please try again later.' });
  }
};
