export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, prompt } = req.body || {};
    if (!/^\d{4}$/.test(String(code || ''))) {
      return res.status(400).json({ error: 'Invalid access code format' });
    }
    if (!prompt || String(prompt).trim().length < 10) {
      return res.status(400).json({ error: 'Prompt is too short' });
    }

    if (!process.env.ACCESS_CODE) {
      return res.status(500).json({ error: 'Server access code is not configured' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }
    if (String(code) !== String(process.env.ACCESS_CODE)) {
      return res.status(401).json({ error: 'Access denied' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-fast-generate-001:predictLongRunning?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: String(prompt).trim() }],
        parameters: { aspectRatio: '16:9' }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Failed to start generation', raw: data });
    }

    if (!data?.name) {
      return res.status(500).json({ error: 'No operation name returned', raw: data });
    }

    return res.status(200).json({ operationName: data.name });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error' });
  }
}
