import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';
const PORT = process.env.PORT || 3000;
const LIMIT = +process.env.RATE_LIMIT_PER_MIN || 20;

const app = express();
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// very small in-memory rate limit (per IP, per minute)
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

// tells the page whether live AI is available (never returns the key)
app.get('/api/status', (req, res) => res.json({ ai: !!KEY, model: MODEL }));

app.post('/api/chat', async (req, res) => {
  if (!KEY) return res.status(503).json({ error: 'AI is not configured on the server' });
  if (limited(req.ip)) return res.status(429).json({ error: 'Too many requests, please wait a minute' });
  const prompt = req.body && req.body.prompt;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 12000)
    return res.status(400).json({ error: 'Invalid prompt' });

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + KEY,
        'X-Title': 'ATHAR Expo 2030 prototype'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 700
      }),
      signal: ctl.signal
    });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401 || r.status === 403) return res.status(401).json({ error: 'OpenRouter rejected the server key' });
    if (!r.ok) return res.status(502).json({ error: (d.error && d.error.message) || 'OpenRouter error ' + r.status });
    const text = d.choices?.[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'The model returned no text' });
    res.json({ text, model: d.model || MODEL });
  } catch (e) {
    res.status(504).json({ error: e.name === 'AbortError' ? 'The model took too long' : 'Could not reach OpenRouter' });
  } finally {
    clearTimeout(timer);
  }
});

app.listen(PORT, () =>
  console.log(`ATHAR running at http://localhost:${PORT}  (AI: ${KEY ? 'on, model ' + MODEL : 'off, add OPENROUTER_API_KEY to .env'})`)
);
