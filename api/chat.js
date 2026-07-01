const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).set(CORS).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NVIDIA_NIM_API_KEY not configured in Vercel Environment Variables' });
  }

  try {
    const upstream = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await upstream.json();

    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
