export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { operation, code } = req.query || {};
    if (!/^\d{4}$/.test(String(code || ''))) {
      return res.status(400).json({ error: 'Invalid access code format' });
    }
    if (String(code) !== String(process.env.ACCESS_CODE || '')) {
      return res.status(401).json({ error: 'Access denied' });
    }
    if (!operation || typeof operation !== 'string') {
      return res.status(400).json({ error: 'Missing operation name' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const statusUrl = `https://generativelanguage.googleapis.com/v1beta/${operation}?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(statusUrl);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Failed to fetch status', raw: data });
    }

    if (!data?.done) {
      return res.status(200).json({ done: false });
    }

    const fileUrl = data?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
    if (!fileUrl) {
      return res.status(500).json({ error: 'Generation finished but no video URL was found', raw: data });
    }

    const proxyUrl = `/api/video?code=${encodeURIComponent(code)}&file=${encodeURIComponent(fileUrl)}`;
    return res.status(200).json({ done: true, videoUrl: proxyUrl });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error' });
  }
}
