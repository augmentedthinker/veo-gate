export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file, code } = req.query || {};
    if (!/^\d{4}$/.test(String(code || ''))) {
      return res.status(400).json({ error: 'Invalid access code format' });
    }
    if (String(code) !== String(process.env.ACCESS_CODE || '')) {
      return res.status(401).json({ error: 'Access denied' });
    }
    if (!file || typeof file !== 'string') {
      return res.status(400).json({ error: 'Missing file URL' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const decodedUrl = decodeURIComponent(file);
    if (!decodedUrl.startsWith('https://generativelanguage.googleapis.com/')) {
      return res.status(400).json({ error: 'Unsupported file URL' });
    }

    const response = await fetch(decodedUrl, {
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'Failed to fetch video from Gemini', raw: text.slice(0, 1000) });
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(arrayBuffer.byteLength));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error' });
  }
}
