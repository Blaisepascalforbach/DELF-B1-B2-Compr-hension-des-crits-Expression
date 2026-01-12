export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Préflight CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  // Sécurité : POST uniquement
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Use POST" }),
    };
  }

  try {
    // Lecture du prompt
    const { prompt } = JSON.parse(event.body || "{}");

    if (!prompt || typeof prompt !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing prompt" }),
      };
    }

    // Clé API (Netlify Environment Variable)
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Missing GOOGLE_API_KEY" }),
      };
    }

    // Appel Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: err }),
      };
    }

    const data = await response.json();

    // 🔑 Lecture ROBUSTE de la réponse Gemini
    let text = "";
    if (data?.candidates?.length) {
      const parts = data.candidates[0].content?.parts || [];
      text = parts.map(p => p.text || "").join("\n");
    }

    if (!text) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Empty response from Gemini",
          debug: data,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text }),
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: String(e) }),
    };
  }
};
