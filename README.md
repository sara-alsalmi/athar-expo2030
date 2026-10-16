# ATHAR — Expo 2030 Riyadh Journey Planner

**جيتك لها أثر**

ATHAR helps visitors plan their day at Expo 2030 Riyadh. You tell it when you're arriving, how much time you have and what you're into, and it builds a plan with you through an AI chat. You can save stops to a Journey, follow the route on the Expo map, and take a photo tour of the Saudi pavilion.

> This is a prototype. Events, food places, venues and crowd levels are simulated, not official Expo 2030 data.

---

## Features

- **Ask ATHAR:** an AI chat that builds a plan from the event and food data. If the AI is unavailable, built-in rules take over so the app still works.
- **Preferences:** visit date, arrival time, available hours, interests and country.
- **Journeys:** save, rename and delete plans, with undo.
- **Interactive map:** zoom into regions and follow your route stop by stop.
- **Saudi pavilion tour:** eight photo scenes with cultural story markers and fullscreen mode.

---

## Tech stack

- **Front end:** HTML, CSS and JavaScript in a single file, no framework
- **Server:** Node.js and Express
- **AI:** OpenRouter API (NVIDIA Nemotron 3 Super)

---

## Keeping the API key safe

The key lives only on the server. The browser talks to the server's `/api/chat` endpoint, and the server adds the key before forwarding the request to OpenRouter, so the key never reaches the browser or the repo.

The server also limits requests per IP, rejects empty or very long prompts, and gives up on slow AI calls after 40 seconds.

## AI first, rules as backup

Every chat message tries the AI model first. The server checks the answer, and if the model is busy, errors out, is too slow or replies in the wrong format, it retries once while there is time. If it still fails, the chat answers with its built-in rules instead, so visitors always get a reply.

---

## Run it locally

You need [Node.js](https://nodejs.org/) 18 or newer. An [OpenRouter](https://openrouter.ai/keys) key is optional and only needed for live AI.

```bash
npm install
cp .env.example .env    # then add your key after OPENROUTER_API_KEY=
npm start
```

Open **http://localhost:3000**. The chip above the chat shows whether you're on **Live AI** or **Built-in rules**.

| Variable             | Default           | What it does                          |
| -------------------- | ----------------- | ------------------------------------- |
| `OPENROUTER_API_KEY` | *(empty)*         | Turns on live AI                      |
| `OPENROUTER_MODEL`   | `openrouter/free` | Which model to use (`.env.example` sets `nvidia/nemotron-3-super-120b-a12b:free`) |
| `OPENROUTER_REASONING` | `off`           | `off` turns off the model's thinking for faster, complete replies |
| `PORT`               | `3000`            | Server port                           |
| `RATE_LIMIT_PER_MIN` | `20`              | Max AI requests per IP per minute     |

---

## Project structure

```
athar-expo2030/
├── public/
│   ├── index.html         # front end and data
│   └── explore/scenes/    # pavilion tour photos
├── server.js              # serves the site and proxies AI requests
├── .env.example           # settings template
└── package.json
```
