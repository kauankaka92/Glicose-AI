const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'NVIDIA_NIM_API_KEY not set' });

  // Parse body
  let parsed;
  try {
    parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Force model and limit tokens
  const payload = {
    ...parsed,
    model: 'meta/llama-3.1-8b-instruct',
    max_tokens: parsed.max_tokens || 512,
    stream: false
  };

  let upstreamRes;
  let upstreamText;
  try {
    upstreamRes = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    upstreamText = await upstreamRes.text();
  } catch (err) {
    return res.status(502).json({ error: 'Fetch to NVIDIA failed', detail: err.message });
  }

  let data;
  try {
    data = JSON.parse(upstreamText);
  } catch {
    return res.status(502).json({ error: 'NVIDIA returned non-JSON', raw: upstreamText.slice(0, 500) });
  }

  return res.status(upstreamRes.status).json(data);
}

export const config = {
  api: {
    bodyParser: true
  }
};
