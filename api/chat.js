const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function setHeaders(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'NVIDIA_NIM_API_KEY not set' });

  // Lê o body manualmente (Vercel não parseia automaticamente)
  let body;
  try {
    const raw = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
    body = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  try {
    const upstream = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
