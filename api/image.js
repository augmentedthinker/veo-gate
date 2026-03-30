export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, prompt } = req.body || {};
    if (!/^\d{4}$/.test(String(code || ''))) {
      return res.status(400).json({ error: 'Invalid access code format' });
    }
    if (String(code) !== String(process.env.ACCESS_CODE || '')) {
      return res.status(401).json({ error: 'Access denied' });
    }
    if (!prompt || String(prompt).trim().length < 10) {
      return res.status(400).json({ error: 'Prompt is too short' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `Generate a single high-quality image. ${String(prompt).trim()}` }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Image generation failed', raw: data });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const inline = parts.find(part => part.inlineData?.data);
    if (!inline?.inlineData?.data) {
      return res.status(500).json({ error: 'No image data returned', raw: data });
    }

    const mimeType = inline.inlineData.mimeType || 'image/png';
    const dataUrl = `data:${mimeType};base64,${inline.inlineData.data}`;
    return res.status(200).json({ imageUrl: dataUrl });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error' });
  }
}
