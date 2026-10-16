# ATHAR — Expo 2030 Riyadh Journey Planner

**جيتك لها أثر**

Expo 2030 Riyadh will be big, and planning a day there can feel overwhelming. ATHAR makes it simple: you tell it when you're arriving, how much time you have and what you're into, and it builds a plan with you through an AI chat. You can save stops to a Journey, follow the route on the Expo map, and explore pavilions in 360° before you go.

> **Prototype.** Events, food places, venues and crowd levels are simulated, not official Expo 2030 data. The login screen is a demo, so any details work.

---

## Features

- **Ask ATHAR:** an AI chat that builds a day plan from the event and food data.
- **Preferences:** visit date, arrival time, available hours, interests and country.
- **Journeys:** save, rename and delete plans, with undo.
- **Interactive map:** zoom into regions and follow your route stop by stop.
- **360° view:** explore Expo 2030 pavilions virtually from anywhere, with cultural stories along the way.

---

## How it works

**Ask ATHAR is a planning agent, not just a chatbot.** For each message, the app finds the matching events and food places in the dataset and sends them to the AI along with your plan and preferences. The AI replies with an answer and an action (build a plan, add stops or edit the plan). The app checks every suggestion is real and asks you before changing anything. The AI only uses the data it's given, so it can't make up events or times.

**AI first, rules as backup.** If the AI is busy, slow or replies in the wrong format, the server retries once, then falls back to built-in rules, so visitors always get an answer.

**The API key stays on the server.** The browser talks only to `/api/chat`, and the server adds the key before calling OpenRouter. Requests are also rate-limited and time out after 40 seconds.

---

## Tech stack

| Layer     | Tools                                          |
| --------- | ---------------------------------------------- |
| Front end | HTML, CSS and JavaScript (single file, no framework) |
| Server    | Node.js, Express                               |
| AI        | OpenRouter API, NVIDIA Nemotron 3 Super        |
| Config    | dotenv                                         |

---

## Project structure

```
athar-expo2030/
├── public/                  # everything the browser loads
│   ├── index.html           # the full front end and simulated data
│   └── explore/
│       └── scenes/          # photos for the 360° view
├── server.js                # serves the site and proxies AI requests
├── .env.example             # settings template (copy to .env)
├── package.json
└── README.md
```

---

## Run it locally

You need [Node.js](https://nodejs.org/) 18 or newer. An [OpenRouter](https://openrouter.ai/keys) key is optional and only needed for live AI.

```bash
npm install
cp .env.example .env    # add your key after OPENROUTER_API_KEY=
npm start
```

Open **http://localhost:3000**. The chip above the chat shows whether you're on **Live AI** or **Built-in rules**.

| Variable               | Default           | What it does                         |
| ---------------------- | ----------------- | ------------------------------------ |
| `OPENROUTER_API_KEY`   | *(empty)*         | Turns on live AI                     |
| `OPENROUTER_MODEL`     | `openrouter/free` | Which model to use                   |
| `OPENROUTER_REASONING` | `off`             | Keeps replies fast by skipping the model's thinking step |
| `PORT`                 | `3000`            | Server port                          |
| `RATE_LIMIT_PER_MIN`   | `20`              | Max AI requests per IP per minute    |
