# CollectIQ — Loan Collection Conversation Intelligence Platform

AI-powered platform that converts loan collection call recordings into structured intelligence for banks and NBFCs.

## Features

- 🧠 **Repayment Intent Detection** — Score borrower willingness (0-100) with evidence
- 💰 **Promise-to-Pay Extraction** — Amount, date, confidence scoring
- 🛡 **Compliance Monitoring** — Detect threats, harassment, coercion
- 🔄 **Cross-Call Consistency** — Flag contradictions across borrower calls
- 📊 **Dashboard** — KPIs, outcome distribution, risk trends
- ⏱ **Customer Timeline** — Chronological history with intent/risk trajectory

## Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Start server (demo mode with seed data)
npm start

# 3. Open in browser
# http://localhost:3000
```

The app ships with **demo mode enabled** — no API keys required. Five demo customers with 14 realistic collection calls, transcripts, and pre-computed analysis results are loaded automatically.

## Configuration

Copy `.env.example` to `.env` and configure:

| Variable             | Description                    | Default |
| -------------------- | ------------------------------ | ------- |
| `PORT`               | Server port                    | `3000`  |
| `DEMO_MODE`          | Use demo data without API keys | `true`  |
| `OPENROUTER_API_KEY` | For real AI analysis           | —       |
| `DEEPGRAM_API_KEY`   | For real speech-to-text        | —       |

## Architecture

```
Audio → STT (Deepgram) → Transcript → LangChain Pipeline → Analysis Results → Dashboard
                                           ├── Intent Chain
                                           ├── Compliance Chain
                                           ├── PTP Chain
                                           ├── Cross-Call Chain
                                           └── Summary Chain
```

## Tech Stack

- **Backend**: Node.js, Express, Sequelize, SQLite
- **AI**: OpenRouter (multi-model), LangChain-style chains
- **Frontend**: Vanilla HTML/CSS/JS, Canvas charts
- **STT**: Deepgram Nova-2 (optional)
