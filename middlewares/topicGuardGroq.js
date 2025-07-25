// middlewares/topicGuardGroq.js
const { classifyOnTopic } = require('../services/classificationServiceGroq');

module.exports = async function topicGuardGroq(req, res, next) {
  const msg = req.body.message;
  if (!msg) return res.status(400).json({ error: 'message is required' });

  try {
    const tag = await classifyOnTopic(msg);
    if (tag !== 'ON_TOPIC') {
      return res.json({
        reply: '❗ Sorry, I only answer questions about pet adoption and using the Adopaw app.',
        code:  'off_topic'
      });
    }
    next();
  } catch (err) {
    console.error('TopicGuardGroq error:', err);
    // fallback: you can choose to block or allow
    return res.json({
      reply: '🚫 Unable to classify your question—please ask about Adopaw features.',
      code:  'classification_error'
    });
  }
};
