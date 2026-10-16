# ATHAR — Expo 2030 Riyadh Journey Planner

**جيتك لها أثر**

ATHAR is a prototype that helps visitors plan a day at Expo 2030 Riyadh. You set your preferences, chat with an AI assistant that builds a plan from the event and food data, save stops to a Journey, and follow your route on the Expo map. It also includes a photo tour of the Saudi pavilion that you can click through.

> **Data note:** events, food places, venues, crowd levels and map positions are illustrative and simulated. This is not official Expo 2030 information.

---

## Features

- **Preferences:** visit date, arrival time, available hours, interests and country.
- **Ask ATHAR (AI chat):** builds a plan from the event and food data. If live AI is not available, it uses built-in rules.
- **Journeys and plans:** save, rename, delete and undo changes. Each stop has its own details.
- **Interactive Expo map:** pick a region, zoom in and out, and see your route stop by stop.
- **Saudi pavilion photo tour:** eight scenes you can move between, with markers for cultural stories and a fullscreen view.

---

## Project structure

```
athar-expo2030/
├── public/                    # Everything the browser loads
│   ├── index.html             # The whole front end and data (single file)
│   └── explore/
│       └── scenes/            # Photos for the pavilion tour
│           ├── walkway.jpg
│           ├── courtyard.jpg
│           ├── doorway.jpg
│           ├── threshold.jpg
│           ├── gallery.jpg
│           ├── gallery-detail.jpg
│           ├── digital-room.jpg
│           └── projection.jpg
├── server.js                  # Serves public/ and forwards AI requests to OpenRouter
├── package.json
├── package-lock.json
├── .env.example               # Template for your settings (safe to commit)
├── .env                       # Your real key and settings (git ignores it, never commit it)
├── .gitignore
└── README.md
```

---

## Getting started

### Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- An [OpenRouter](https://openrouter.ai/keys) API key (optional, needed for live AI)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your settings file from the template
cp .env.example .env          # on Windows PowerShell: Copy-Item .env.example .env

# 3. Open .env and paste your key after OPENROUTER_API_KEY=

# 4. Start the server
npm start
```

Then open **http://localhost:3000**.

When the server starts, the console says whether AI is on. In the app, the chip above the chat shows **Live AI** or **Built-in rules**.

---

## Environment variables

| Variable             | Required | Default           | Description                                                     |
| -------------------- | -------- | ----------------- | --------------------------------------------------------------- |
| `OPENROUTER_API_KEY` | For AI   | *(empty)*         | Your OpenRouter key. Without it, the app uses built-in rules.   |
| `OPENROUTER_MODEL`   | No       | `openrouter/free` | `openrouter/free` picks any free model, or use an id ending `:free`. |
| `PORT`               | No       | `3000`            | Port the server listens on.                                     |
| `RATE_LIMIT_PER_MIN` | No       | `20`              | Maximum AI requests per IP address per minute.                  |

---

## How the API key is protected

- The key is only read on the server, from `process.env` in `server.js`. It does not appear anywhere in `public/index.html`.
- The browser calls the server's own `/api/chat` endpoint. The server adds the key and forwards the request to OpenRouter, so the key never reaches the browser.
- `/api/status` only tells the page whether AI is available. It never returns the key.
- The server only serves files from `public/`, so `.env` and `server.js` cannot be downloaded from the website.
- `.gitignore` excludes `.env` and every `.env.*` file except `.env.example`, so your key is never committed.
- The server limits requests per IP address, rejects prompts that are empty or too long, and times out slow calls after 30 seconds.

**If your key is ever exposed** (pushed to GitHub, pasted in public, shared by mistake), revoke it at https://openrouter.ai/keys and create a new one. Deleting the file afterwards is not enough, because the key stays in git history.

---

## Deploying

Deploy to any host that runs Node, such as Render, Railway or Fly.io:

1. Set the build command to `npm install` and the start command to `npm start`.
2. Add the variables from the table above in the host's **Environment** settings.
3. Do not upload `.env`. The host provides those values instead.

> Opening `public/index.html` directly from disk works, but the AI uses built-in rules because there is no server. GitHub Pages works the same way, since it can only host static files.

---

## Tech stack

- **Front end:** a single HTML file with plain HTML, CSS and JavaScript (no framework)
- **Server:** Node.js and Express
- **AI:** OpenRouter chat completions API
- **Config:** dotenv
