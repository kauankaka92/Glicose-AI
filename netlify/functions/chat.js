const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  console.log('API Key exists:', !!apiKey);
  
  if (!apiKey) {
    console.error('NVIDIA_NIM_API_KEY not found in environment');
    return res.status(500).json({ 
      error: 'NVIDIA_NIM_API_KEY not set',
      envKeys: Object.keys(process.env).filter(k => !k.includes('TOKEN') && !k.includes('SECRET'))
    });
  }

  // Parse body
  let parsed;
  try {
    parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('Request parsed, messages:', parsed.messages?.length);
  } catch (err) {
    console.error('JSON parse error:', err.message);
    return res.status(400).json({ error: 'Invalid JSON', detail: err.message });
  }

  // Force model and limit tokens
  const payload = {
    ...parsed,
    model: 'meta/llama-3.1-8b-instruct',
    max_tokens: parsed.max_tokens || 512,
    stream: false
  };

  console.log('Sending to NVIDIA...');

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
    console.log('NVIDIA response status:', upstreamRes.status);
  } catch (err) {
    console.error('Fetch to NVIDIA failed:', err.message);
    return res.status(502).json({ error: 'Fetch to NVIDIA failed', detail: err.message });
  }

  let data;
  try {
    data = JSON.parse(upstreamText);
  } catch {
    console.error('NVIDIA returned non-JSON:', upstreamText.slice(0, 200));
    return res.status(502).json({ error: 'NVIDIA returned non-JSON', raw: upstreamText.slice(0, 500) });
  }

  console.log('Success, returning response');
  return res.status(upstreamRes.status).json(data);
}

export const config = {
  api: {
    bodyParser: true
  }
};
