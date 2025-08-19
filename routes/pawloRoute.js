// routes/pawloRoute.js
const express = require("express");
const router = express.Router();

const { getChatReply } = require("../services/chatService");
const { classifyOnTopic } = require("../services/classificationServiceGroq");
const { describeMany } = require("../services/visionServiceGroq");

const flag = (v) => String(v ?? "0").trim().toLowerCase();
const ENABLE_CLASSIFY = ["1","true","yes"].includes(flag(process.env.ENABLE_CLASSIFY));
const VISION_ENABLED  = ["1","true","yes"].includes(flag(process.env.GROQ_VISION_ENABLED));

router.post(["/pawlo/reply", "/reply"], async (req, res) => {
  const { message, history, imageUrls } = req.body || {};

  const hasText = typeof message === "string" && message.trim().length > 0;
  const images  = Array.isArray(imageUrls)
    ? imageUrls.filter((u) => typeof u === "string" && u.trim())
    : [];

  if (!hasText && images.length === 0) {
    return res.status(400).json({ error: "message or imageUrls required" });
  }

  try {
    console.log("[PAWLO] imageUrls:", images);

    // 1) Optional topical classifier
    if (ENABLE_CLASSIFY) {
      try {
        const probe = hasText ? message : "User sent pet-related image(s).";
        const label = String(await classifyOnTopic(probe)).trim().toUpperCase();
        console.log("[PAWLO] classify:", { label, hasText, images: images.length });
        if (label !== "ON_TOPIC") {
          return res.json({
            reply:
              "I can help with Adopaw and pet-care questions—adoption, listings, profiles, care tips, and app features. 🐾",
          });
        }
      } catch (e) {
        console.warn("[PAWLO] classify failed, continuing:", e?.message || e);
      }
    }

    // 2) Vision → short notes (but DO NOT expose them in the user text)
    let extraSystemMsg = null;
    if (VISION_ENABLED && images.length) {
      try {
        const notes = await describeMany(images, hasText ? message : "");
        const lines = (notes || [])
          .map(n => (n.note || "").trim())
          .filter(Boolean)
          .map(s => `- ${s}`);

        if (lines.length) {
          extraSystemMsg = {
            role: "system",
            content:
`VISUAL_CONTEXT (from analyzed images):
${lines.join("\n")}

Rules for assistant:
- Speak as if you personally inspected the images.
- NEVER mention notes, URLs, “vision,” “image notes,” or say you cannot see images.
- Do not include or reference any links unless the user explicitly asks.
- If uncertain, ask one brief follow-up question.`,
          };
        }
      } catch (e) {
        console.warn("[PAWLO] vision failed:", e?.message || e);
      }
    }

    // 3) Compose final user text (no URLs or “image notes” headings)
    const baseText = hasText
      ? message.trim()
      : "Please help the user based on the uploaded photo(s).";

    // 4) Build history (inject the hidden visual context as a system msg)
    const safeHistory = Array.isArray(history) ? [...history] : [];
    if (extraSystemMsg) safeHistory.push(extraSystemMsg);

    // 5) Call the text model
    const reply = await getChatReply(baseText, safeHistory);

    // 6) Fallback if empty (rare)
    const finalReply =
      images.length && !String(reply || "").trim()
        ? "I’m looking at the photo(s). What would you like me to focus on?"
        : reply || "I’m here to help!";

    return res.json({ reply: finalReply });
  } catch (e) {
    console.error("pawlo reply error:", e?.message || e);
    return res.status(500).json({ error: "failed_to_reply" });
  }
});

module.exports = router;
