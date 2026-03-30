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
    const payload = {
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
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return res.status(500).json({ error: 'Image route returned non-JSON response', raw: text.slice(0, 1500) });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Image generation failed', raw: data });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    let inlineData = null;
    for (const part of parts) {
      if (part?.inlineData?.data) {
        inlineData = part.inlineData;
        break;
      }
      if (part?.inline_data?.data) {
        inlineData = part.inline_data;
        break;
      }
    }

    if (!inlineData?.data) {
      return res.status(500).json({ error: 'No image data returned from model', raw: data });
    }

    const mimeType = inlineData.mimeType || inlineData.mime_type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${inlineData.data}`;
    return res.status(200).json({ imageUrl: dataUrl, mimeType });
  } catch (error) {
    return res.status(500).json({ error: error.name === 'AbortError' ? 'Image generation timed out after 120 seconds' : (error.message || 'Unexpected server error') });
  }
}
