// services/chatService.js
const fetch = require('node-fetch');
const { GROQ_API_URL, GROQ_API_KEY } = process.env;

async function getChatReply(message, history = []) {
  const messages = [
    { role: 'system', content: 'You are Adopaw’s friendly pet‑care assistant.' },
    ...history,
    { role: 'user',   content: message }
  ];
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model:       'meta-llama/llama-4-scout-17b-16e-instruct',
      messages,
      max_tokens:  300,
      temperature: 0.7
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const { choices } = await res.json();
  return choices[0]?.message?.content.trim() || '';
}

module.exports = { getChatReply };
