// controllers/pawloController.js
const { getChatReply } = require("../services/chatService");
const { classifyOnTopic } = require("../services/classificationServiceGroq");

/**
 * POST /chat-api/pawlo/reply
 * body: { message: string, history?: Array<{role:'user'|'assistant', content:string}> }
 */
exports.reply = async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message required" });
    }

    // (optional) guardrail — won't block on failure
    let guard = "ON_TOPIC";
    try { guard = await classifyOnTopic(message); } catch {}

    // keep history short to save tokens
    const shortHistory = Array.isArray(history) ? history.slice(-10) : [];

    const reply = await getChatReply(message, shortHistory);
    return res.json({ reply, guard });
  } catch (e) {
    return res.status(500).json({ error: e.message || "pawlo error" });
  }
};
