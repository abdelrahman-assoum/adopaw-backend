// services/classificationServiceGroq.js
const fetch = require('node-fetch');
const { GROQ_API_URL, GROQ_API_KEY } = process.env;

async function classifyOnTopic(message) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',  // preferred Groq model
      messages: [
        {
          role: 'system',
          content:
            `You are a strict classifier. Respond with exactly ONE token: ON_TOPIC or OFF_TOPIC.

            ON_TOPIC if the user's request is about:
            - Adopaw app features (adopting/browsing/listing pets, messaging owners, profiles, comments, maps, scheduling, Pawlo chat).
            - Pet-care topics (nutrition, health red flags, behavior, grooming, training, enrichment, adoption process).
            - Describing or asking about a pet photo or image related to care/adoption.

            OFF_TOPIC for everything else.

            Important: Output ONLY ON_TOPIC or OFF_TOPIC with no punctuation or extra words.`

        },
        { role: 'user', content: message }
      ],
      max_tokens: 2,
      temperature: 0
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
