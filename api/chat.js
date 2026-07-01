const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'NVIDIA_NIM_API_KEY not set' });

  // Lê body como stream
  let rawBody = '';
  try {
    rawBody = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk.toString(); });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  } catch (err) {
    return res.status(400).json({ error: 'Failed to read body', detail: err.message });
  }

  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON', raw: rawBody.slice(0, 200) });
  }

  // Força modelo correto e limita tokens
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
    // Retorna o texto cru para debug
    return res.status(502).json({ error: 'NVIDIA returned non-JSON', raw: upstreamText.slice(0, 500) });
  }

  return res.status(upstreamRes.status).json(data);
}
