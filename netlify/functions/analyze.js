export const handler = async (event) => {
  // Autoriser POST uniquement
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Use POST" }),
    };
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing GOOGLE_API_KEY" }),
      };
    }

    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing prompt" }),
      };
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      apiKey;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await r.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        text:
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Réponse vide",
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(e) }),
    };
  }
};
