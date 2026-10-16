import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';
const PORT = process.env.PORT || 3000;
const LIMIT = +process.env.RATE_LIMIT_PER_MIN || 20;
// "off" stops reasoning models from spending the token budget on hidden thinking
const THINKING = (process.env.OPENROUTER_REASONING || 'off').toLowerCase() !== 'off';
// the page gives up after 45s, so the server must answer (or fail) before that
const DEADLINE_MS = 40000;

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

// the chat asks for {"reply":"...","action":{...}}; returns that JSON text, or null if the answer is unusable
function validReply(text) {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try {
    const j = JSON.parse(text.slice(a, b + 1));
    return j && typeof j.reply === 'string' && j.reply.trim() ? text.slice(a, b + 1) : null;
  } catch {
    return null;
  }
}

async function callModel(messages, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
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
        messages,
        temperature: 0.3,
        max_tokens: 700,
        ...(THINKING ? {} : { reasoning: { enabled: false } })
      }),
      signal: ctl.signal
    });
    const d = await r.json().catch(() => ({}));
    return { status: r.status, ok: r.ok, d };
  } finally {
    clearTimeout(timer);
  }
}

// tells the page whether live AI is available (never returns the key)
app.get('/api/status', (req, res) => res.json({ ai: !!KEY, model: MODEL }));

// any error response makes the page answer with its built-in rules instead
app.post('/api/chat', async (req, res) => {
  if (!KEY) return res.status(503).json({ error: 'AI is not configured on the server' });
  if (limited(req.ip)) return res.status(429).json({ error: 'Too many requests, please wait a minute' });
  const { prompt, system } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 12000)
    return res.status(400).json({ error: 'Invalid prompt' });
  if (system !== undefined && (typeof system !== 'string' || system.length > 12000))
    return res.status(400).json({ error: 'Invalid system prompt' });

  const messages = system
    ? [{ role: 'system', content: system }, { role: 'user', content: prompt }]
    : [{ role: 'user', content: prompt }];
  const start = Date.now();
  let problem = 'The model returned no text';
  // one retry for a busy model or a bad answer, only while there is time left before the page gives up
  for (let attempt = 0; attempt < 2; attempt++) {
    const left = DEADLINE_MS - (Date.now() - start);
    if (attempt > 0 && left < 12000) break;
    try {
      const { status, ok, d } = await callModel(messages, left);
      if (status === 401 || status === 403) return res.status(401).json({ error: 'OpenRouter rejected the server key' });
      if (!ok) {
        problem = (d.error && d.error.message) || 'OpenRouter error ' + status;
        if (status === 429 || status >= 500) continue;
        return res.status(502).json({ error: problem });
      }
      const text = d.choices?.[0]?.message?.content?.trim();
      if (!text) continue;
      // chat requests (the ones with a system prompt) must follow the JSON format
      if (system) {
        const json = validReply(text);
        if (!json) { problem = 'The model reply was not in the expected format'; continue; }
        return res.json({ text: json, model: d.model || MODEL });
      }
      return res.json({ text, model: d.model || MODEL });
    } catch (e) {
      return res.status(504).json({ error: e.name === 'AbortError' ? 'The model took too long' : 'Could not reach OpenRouter' });
    }
  }
  res.status(502).json({ error: problem });
});

app.listen(PORT, () =>
  console.log(`ATHAR running at http://localhost:${PORT}  (AI: ${KEY ? 'on, model ' + MODEL : 'off, add OPENROUTER_API_KEY to .env'})`)
);
