// services/classificationServiceGroq.js
const fetch = require('node-fetch');
const { GROQ_API_URL, GROQ_API_KEY } = process.env;

async function classifyOnTopic(message) {
  const res = await fetch(GROQ_API_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',  // preferred Groq model
      messages: [
        {
          role:    'system',
          content:
            `You are a classifier.  Answer with exactly ONE word: ON_TOPIC or OFF_TOPIC.\n` +
            `ON_TOPIC means the user is asking about the Adopaw app: adopting, browsing/listing pets, profiles, ` +
            `comments, maps, scheduling, AI chat advice, etc.  Otherwise answer OFF_TOPIC.`
        },
        { role: 'user', content: message }
      ],
      max_tokens:   2,
      temperature:  0
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Classification error ${res.status}: ${err}`);
  }

  const { choices } = await res.json();
  // content might be like "ON_TOPIC" or "OFF_TOPIC"
  return choices[0].message.content.trim();
}

module.exports = { classifyOnTopic };
