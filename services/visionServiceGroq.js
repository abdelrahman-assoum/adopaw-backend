// services/visionServiceGroq.js
const fetch = require("node-fetch");

const {
  GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions",
  GROQ_API_KEY,
  GROQ_VISION_MODEL,
} = process.env;

// default: the “instruct” variant is better for short, reliable captions
const MODEL = GROQ_VISION_MODEL || "llama-3.2-11b-vision-instruct";

/**
 * Describe one image URL with optional text hint.
 */
async function describeOne(url, hint = "") {
  const content = [
    {
      type: "text",
      text:
        [
          "You are describing a user-supplied image for a pet-adoption app.",
          "If the image fails to load, reply exactly: UNAVAILABLE.",
          hint ? `User context: "${hint}"` : "",
          "Describe what you SEE (do not make up details).",
          "Focus on: species, coat color/pattern, approx age/size, posture/mood, any visible health issues, background clues relevant to adoption.",
          "Limit to 1–2 sentences.",
        ]
          .filter(Boolean)
          .join("\n"),
    },
    { type: "image_url", image_url: { url } },
  ];

  const body = {
    model: MODEL,
    messages: [{ role: "user", content }],
    temperature: 0.1,
    max_tokens: 180,
    top_p: 0.2,
  };

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`vision error ${res.status}: ${err}`);
  }

  const json = await res.json();
  const note = json?.choices?.[0]?.message?.content?.trim?.() || "";
  if (!note || /UNAVAILABLE/i.test(note)) return { url, note: "" };
  return { url, note };
}

/**
 * Given public image URLs, return [{ url, note }]
 */
async function describeMany(imageUrls = [], hint = "") {
  const urls = (Array.isArray(imageUrls) ? imageUrls : [])
    .map((u) => String(u || "").trim())
    .filter(Boolean);

  const out = [];
  for (const url of urls) {
    try {
      out.push(await describeOne(url, hint));
    } catch (e) {
      // don’t crash the whole turn—just skip this image
      out.push({ url, note: "" });
      console.warn("[vision] describeOne failed:", e?.message || e);
    }
  }
  return out;
}

module.exports = { describeMany };
