# CollectIQ — Architecture & Build Guide

---

## Stack Overview

| Layer | Technology |
|---|---|
| Runtime | Node.js (CommonJS) |
| HTTP Framework | Express.js |
| ORM | Sequelize v6 |
| Database | SQLite (local) |
| Speech-to-Text | OpenAI Whisper (`whisper-1`) via official `openai` SDK |
| LLM | OpenRouter API (multi-model gateway) |
| Speaker Diarization | LLM-based content analysis (via OpenRouter) |
| File Upload | Multer (disk storage) |
| Logging | Winston (structured JSON) |
| Security | Helmet, express-rate-limit, express-validator |
| Frontend | Vanilla JS, HTML, CSS (no framework, no build step) |

---

## Repository Layout

```
loan_collection_sentiment_analysis/
├── backend/
│   ├── server.js                        # HTTP server entry point
│   ├── config/
│   │   └── index.js                     # Centralised env config (dotenv)
│   ├── db/
│   │   ├── setup.js                     # Sequelize init + model associations
│   │   ├── seed.js                      # Demo data seeder
│   │   └── models/
│   │       ├── Customer.js
│   │       ├── Call.js
│   │       ├── TranscriptSegment.js
│   │       └── AnalysisResult.js
│   ├── services/
│   │   ├── sttService.js                # Whisper STT + LLM diarization
│   │   └── openRouterClient.js          # OpenRouter LLM gateway
│   ├── ai/
│   │   ├── pipeline.js                  # Orchestrates all analysis chains
│   │   ├── chains/
│   │   │   ├── intentChain.js           # Repayment intent scoring
│   │   │   ├── complianceChain.js       # Compliance violation detection
│   │   │   ├── ptpChain.js              # Promise-to-pay extraction
│   │   │   ├── crossCallChain.js        # Cross-call inconsistency detection
│   │   │   └── summaryChain.js          # Call summary + outcome + next actions
│   │   └── prompts/
│   │       ├── intent.txt
│   │       ├── compliance.txt
│   │       ├── ptp.txt
│   │       ├── crossCall.txt
│   │       └── summary.txt
│   └── src/
│       ├── app.js                       # Express app factory (middleware + routes)
│       ├── api/
│       │   ├── controllers/
│       │   │   ├── calls.controller.js
│       │   │   ├── customers.controller.js
│       │   │   └── dashboard.controller.js
│       │   ├── routes/
│       │   │   ├── health.js
│       │   │   └── v1/
│       │   │       ├── index.js
│       │   │       ├── calls.routes.js
│       │   │       ├── customers.routes.js
│       │   │       ├── dashboard.routes.js
│       │   │       └── models.routes.js
│       │   ├── validators/
│       │   │   ├── calls.validators.js
│       │   │   └── customers.validators.js
│       │   └── middlewares/
│       │       ├── errorHandler.js
│       │       ├── notFound.js
│       │       ├── rateLimiter.js
│       │       ├── requestId.js
│       │       └── validate.js
│       └── shared/
│           ├── asyncHandler.js
│           ├── errors.js
│           └── logger.js
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── api.js                       # Fetch wrapper / API client
│       ├── app.js                       # Router + state + modal management
│       ├── charts.js                    # Canvas chart primitives
│       ├── dashboard.js                 # Dashboard view
│       ├── callList.js                  # Call list view
│       ├── callDetail.js                # Call detail + analysis view
│       ├── customerTimeline.js          # Customer cross-call timeline view
│       └── uploadCall.js                # Upload + pipeline modal
├── .env.example
├── .gitignore
├── PRODUCT_STRATEGY.md
└── BUILD.md
```

---

## Environment Setup

Copy `.env.example` to `.env` inside `backend/` and fill in the two required keys:

```
OPENAI_API_KEY=sk-...          # OpenAI — used for Whisper STT only
OPENROUTER_API_KEY=sk-or-...   # OpenRouter — used for all LLM analysis
NODE_ENV=development
PORT=3000
```

No other services are required. SQLite is created automatically on first run.

---

## Running Locally

```bash
cd backend
npm install
node server.js          # production
npm run dev             # nodemon watch mode
npm run seed            # populate demo data
```

Open `frontend/index.html` directly in a browser (via `file://`) or serve it from any static server. The API client always points to `http://localhost:3000/api`.

---

## API Reference

All routes are prefixed `/api/v1` unless noted.

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health/ready` | Readiness check — returns mode, db status, uptime |

### Calls

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/calls` | List all calls (with customer + analysis) |
| GET | `/api/v1/calls/:id` | Single call with transcript segments + full analysis |
| POST | `/api/v1/calls/upload` | Upload audio file, create pending call record |
| POST | `/api/v1/calls/upload-and-analyze` | Upload + STT + diarization + full AI analysis in one request |
| POST | `/api/v1/calls/:id/transcribe` | Run Whisper STT + LLM diarization on an uploaded call |
| POST | `/api/v1/calls/:id/analyze` | Run full AI analysis pipeline on a transcribed call |

### Customers

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/customers` | List all customers with latest call stats |
| GET | `/api/v1/customers/:id/timeline` | Full cross-call timeline for one customer |
| POST | `/api/v1/customers` | Create a new customer record |

### Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/dashboard/stats` | KPIs, outcome distribution, risk distribution, recent calls |

### Models

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/models` | Available LLM models and the default |

---

## Data Models

### Customer
```
id               string   PK  (CUST-XXXXXXXX)
name             string
phone            string
loanId           string   unique
loanAmount       float
outstandingAmount float
riskLevel        enum     low | medium | high | critical
daysPastDue      integer
totalCalls       integer
```

### Call
```
id               string   PK  (CALL-XXXXXXXX)
customerId       string   FK -> Customer
agentName        string
callDate         datetime
duration         integer  seconds
audioUrl         string   path to uploaded file
status           enum     pending | transcribed | analyzed
```

### TranscriptSegment
```
id               string   PK  (CALL-XXXXXXXX-SEG-NNN)
callId           string   FK -> Call
speaker          enum     agent | customer
startTime        float    seconds
endTime          float    seconds
text             string
```

### AnalysisResult
```
id               string   PK  (ANALYSIS-XXXXXXXX)
callId           string   FK -> Call  unique
repaymentIntent  json     { score, level, evidence, signals }
complianceFlags  json     [{ type, severity, evidence, timestamp }]
promiseToPay     json     { detected, amount, date, installment, confidence, details }
crossCallFlags   json     [{ field, previousClaim, currentClaim, callId }]
outcome          enum     payment_committed | partial_commitment | no_commitment | dispute_raised | escalation_required | callback_scheduled | not_reachable
summary          text
keyPoints        json     string[]
nextActions      json     string[]
riskFlags        json     string[]
riskScore        integer  0–100
```

---

## Processing Pipeline

### Upload-and-Analyze Flow (`POST /api/v1/calls/upload-and-analyze`)

This is the primary entry point for new calls. It runs all three stages synchronously in a single HTTP request.

```
Client
  |
  |-- POST /api/v1/calls/upload-and-analyze (multipart: audio, customerId, agentName, model?)
  |
  v
calls.controller.js → uploadAndAnalyze()
  |
  |-- 1. Validate customer exists
  |-- 2. Save audio file to disk (multer → backend/uploads/)
  |-- 3. Create Call record (status: pending)
  |
  |-- 4. sttService.transcribe(audioPath, model)
  |       |
  |       |-- OpenAI Whisper API (whisper-1, verbose_json)
  |       |   Returns raw segments with timestamps
  |       |
  |       |-- Group segments into speaker turns (gap > 0.8s = new turn)
  |       |
  |       |-- LLM diarization via OpenRouter
  |       |   Sends numbered turns to LLM with collection-call context prompt
  |       |   LLM assigns "agent" or "customer" to each turn based on content
  |       |   Falls back to alternating heuristic if LLM fails
  |       |
  |       Returns: [{ speaker, startTime, endTime, text }]
  |
  |-- 5. Save TranscriptSegments to DB
  |-- 6. Update Call status: transcribed
  |
  |-- 7. pipeline.analyze(call, { model })
  |       |
  |       |-- Build transcript text: "[AGENT] text\n[CUSTOMER] text\n..."
  |       |
  |       |-- Run 4 chains in parallel (Promise.all):
  |       |   intentChain      → repaymentIntent { score, level, evidence, signals }
  |       |   complianceChain  → complianceFlags [{ type, severity, evidence }]
  |       |   ptpChain         → promiseToPay { detected, amount, date, confidence }
  |       |   summaryChain     → { summary, keyPoints, nextActions, riskFlags, outcome }
  |       |
  |       |-- Run sequentially (needs history):
  |       |   crossCallChain   → crossCallFlags [{ field, previousClaim, currentClaim }]
  |       |   (fetches all previous analyses for this customer from DB)
  |       |
  |       |-- Compute riskScore (0–100):
  |       |   Base: 50
  |       |   + (50 - intentScore) * 0.4   (low intent = higher risk)
  |       |   + 15 per high-severity compliance flag
  |       |   + 8 per medium-severity compliance flag
  |       |   + 10 if no PTP detected
  |       |   + 5 per cross-call inconsistency
  |       |
  |       |-- Upsert AnalysisResult to DB
  |       |-- Update Call status: analyzed
  |       |
  |       Returns: AnalysisResult
  |
  |-- 8. Return { callId, segmentCount, analysis } to client
```

### LLM Chain Architecture

Each chain follows the same pattern:

```
chain.analyze(transcriptText, model)
  |
  |-- Reads system prompt from backend/ai/prompts/<chain>.txt
  |-- Calls openRouterClient.callModel(model, systemPrompt, transcriptText)
  |       |
  |       |-- POST https://openrouter.ai/api/v1/chat/completions
  |       |-- Augments system prompt: "Reply with ONLY raw JSON..."
  |       |-- Parses response with extractJSON():
  |       |   Handles markdown fences, <think> tags, prose wrapping
  |       |-- Retries on 429 (rate limit) with exponential backoff
  |       Returns: parsed JSON object or array
  |
  Returns: typed result object
```

### Available LLM Models

| ID | Label | Provider |
|---|---|---|
| `qwen/qwen3-235b-a22b` | Qwen 3 235B | Qwen |
| `stepfun/step-3.5-flash:free` | Step 3.5 Flash | StepFun (default) |
| `arcee-ai/trinity-large-preview:free` | Trinity Large Preview | Arcee AI |
| `upstage/solar-pro-3:free` | Solar Pro 3 | Upstage |
| `z-ai/glm-4.7-flash` | GLM-4.7 Flash | Z-AI |

---

## Frontend Architecture

The frontend is a single-page application with no build step. All JS is loaded as plain scripts in `index.html`.

### Routing

`app.js` manages routing via the URL hash (`#dashboard`, `#calls`, `#call/CALL-ID`, `#customers`, `#customer/CUST-ID`, `#compliance`). A `hashchange` listener calls `handleRoute()` which renders the appropriate view into `#page-content`.

Navigation is locked during pipeline processing (`App.lockForPipeline()`) to prevent page re-renders from destroying the progress overlay.

### View Modules

| File | Responsibility |
|---|---|
| `dashboard.js` | KPI cards, outcome/risk charts, recent calls table |
| `callList.js` | Filterable call table with intent gauges and outcome badges |
| `callDetail.js` | Full transcript, analysis panels, re-analyze trigger |
| `customerTimeline.js` | Cross-call history, intent/risk trend charts, inconsistency cards |
| `uploadCall.js` | Multi-step upload modal — form, pipeline progress, results |
| `charts.js` | Canvas-based donut and horizontal bar chart primitives |
| `api.js` | Fetch wrapper — always points to `http://localhost:3000/api` |

### Upload Modal Flow

```
Step 1 (form)         — rendered in #modal-overlay (dismissible)
  |
  | user clicks "Start Pipeline"
  v
Step 2 (processing)   — rendered in #pipeline-overlay (non-dismissible, router locked)
  |
  | API.uploadAndAnalyze() resolves
  | Steps tick green one by one (450ms apart)
  v
Step 3 (results)      — rendered in #modal-overlay (dismissible)
                        Shows: callId, outcome, intent score, risk score, PTP, compliance flags, summary
```

---

## Security & Middleware Stack

Request lifecycle through Express:

```
Request
  → requestId middleware     (attaches UUID correlation ID to req + response header)
  → morgan HTTP logger       (structured access log)
  → helmet                   (security headers)
  → cors                     (allowlist from CORS_ORIGINS env var)
  → express.json()
  → apiLimiter               (100 req/15min on all API routes)
  → uploadLimiter            (10 req/15min on upload endpoints)
  → analysisLimiter          (20 req/15min on analysis endpoints)
  → route validators         (express-validator schemas)
  → validate middleware      (returns 422 on validation failure)
  → controller (asyncHandler wraps all async errors)
  → errorHandler middleware  (formats AppError into structured JSON response)
```

### Error Response Shape

```json
{
  "success": false,
  "error": {
    "code": "CALL_NOT_FOUND",
    "message": "Human-readable description",
    "detail": "Optional extra context"
  }
}
```

### Defined Error Codes

| Code | HTTP Status |
|---|---|
| `VALIDATION_ERROR` | 422 |
| `NOT_FOUND` | 404 |
| `CALL_NOT_FOUND` | 404 |
| `CUSTOMER_NOT_FOUND` | 404 |
| `TRANSCRIPT_MISSING` | 422 |
| `CONFLICT` | 409 |
| `BAD_REQUEST` | 400 |
| `INTERNAL_ERROR` | 500 |
| `ANALYSIS_FAILED` | 500 |

---

## Logging

Winston writes structured JSON to stdout. Every log line includes a `requestId` correlation field when inside a request context.

```json
{ "level": "info", "message": "AI pipeline complete", "callId": "CALL-ABC123", "riskScore": 72, "outcome": "partial_commitment", "model": "stepfun/step-3.5-flash:free" }
```

Log levels: `error` → `warn` → `info` → `debug` (set via `LOG_LEVEL` env var, default `debug`).

---

## Known Constraints (Current Build)

| Constraint | Detail |
|---|---|
| Single-tenant | One SQLite database, one instance, no auth |
| Synchronous pipeline | STT + analysis run inline in the HTTP request (~30–60s per call) |
| No audio streaming | Full file must be uploaded before processing starts |
| No PII encryption | Transcript text stored in plaintext in SQLite |
| No background workers | No Redis queue — everything is request-scoped |
| No auth | All API endpoints are open — suitable for local/internal use only |
| File storage | Audio files stored on local disk in `backend/uploads/` |

---

## Production Upgrade Path

| Current | Production Target |
|---|---|
| SQLite | PostgreSQL with migration scripts |
| Synchronous pipeline | Redis queue + separate STT and analysis workers |
| Local disk storage | S3-compatible object storage |
| No auth | JWT with role-based access (manager, agent, compliance, risk) |
| No PII handling | Transcript retention policy + encryption at rest |
| Single instance | Containerised API + worker services |
| No observability | Metrics (queue depth, latency, error rates) + distributed tracing |
