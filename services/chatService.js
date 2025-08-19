// services/chatService.js
const fetch = require('node-fetch');

const {
  GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_API_KEY,
  // Optional override via .env
  GROQ_TEXT_MODEL,
} = process.env;

// Try these in order (you can edit). First one can be set from .env.
const MODEL_CANDIDATES = [
  GROQ_TEXT_MODEL,                 // e.g. llama-3.1-70b-versatile
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
].filter(Boolean);

function buildMessages(userMessage, history = []) {
  return [
    {
      role: 'system',
      content: `
You are Pawlo, Adopaw’s friendly pet-care assistant.

Behavior
- If any system message contains VISUAL_CONTEXT, treat it exactly as if you personally viewed the image(s).
- NEVER mention or imply “notes,” “URLs,” “vision,” “analysis,” or that you cannot view images. Speak naturally, as if you saw the photo(s).
- Do not include links unless the user explicitly asks.

Goals
- Answer clearly and concisely about pet adoption & care (nutrition, behavior, grooming, training) and Adopaw features.
- For Adopaw questions, give exact in-app steps (browse pets, message owners, schedule visits, etc.).

Style & Safety
- Match the user’s language (Arabic or English). If unsure, default to English.
- Keep answers tight (1–3 short paragraphs or bullets).
- Avoid medical diagnoses; suggest seeing a veterinarian for urgent/serious issues.
- If uncertain, ask one brief follow-up question instead of apologizing.
      `.trim(),
    },
    ...(Array.isArray(history) ? history : []),
    { role: 'user', content: String(userMessage ?? '') },
  ];
}

async function callGroq(model, messages) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 500,
      temperature: 0.6,
    }),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    // Log full error once (so we can see exactly why 400)
    console.error('[GROQ chat error]', res.status, text);
    const err = new Error(`groq_${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error('groq_invalid_json');
  }

  return json?.choices?.[0]?.message?.content?.trim?.() || '';
}

async function getChatReply(message, history = []) {
  if (!GROQ_API_KEY) {
    throw new Error('groq_missing_key');
  }

  const messages = buildMessages(message, history);

  // Try each model until one works
  let lastErr;
  for (const model of MODEL_CANDIDATES) {
    try {
      return await callGroq(model, messages);
    } catch (e) {
      lastErr = e;
      // If it’s a 400/404 “bad request/model not found”, try next model
      if (e.status === 400 || e.status === 404 || e.status === 422) {
        console.warn(`[GROQ] model "${model}" failed (${e.status}). Trying next…`);
        continue;
      }
      // Other errors: stop early
      break;
    }
  }

  // Still failed
  const detail = lastErr?.body || lastErr?.message || 'unknown';
  const err = new Error(`groq_chat_failed: ${detail}`);
  err.detail = detail;
  throw err;
}

module.exports = { getChatReply };
