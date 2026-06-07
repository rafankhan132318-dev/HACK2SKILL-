<div align="center">

<img src="https://img.shields.io/badge/SpoProof-Sports%20Media%20Verification-6366F1?style=for-the-badge&logo=shield&logoColor=white" alt="SpoProof" height="40"/>

# 🛡️ SpoProof
### AI-Powered Sports Media Verification Platform

**Verify the authenticity of any sports image, video, screenshot, or article in seconds — using a 6-signal AI pipeline powered by Bitmind, Gemini, and Google.**

<br/>

[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

<br/>

[**Live Demo**](https://spoproof.vercel.app) · [**Backend API**](https://spoproof-backend.up.railway.app/health) · [**Documentation**](#-documentation) · [**Report Bug**](issues) · [**Request Feature**](issues)

<br/>

![SpoProof Dashboard Preview](https://via.placeholder.com/900x500/09090B/6366F1?text=SpoProof+%E2%80%94+Trust+Nothing.+Verify+Everything.)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [The 6-Signal Pipeline](#-the-6-signal-pipeline)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

---

## 🎯 About the Project

The sports media landscape is increasingly polluted with deepfakes, manipulated clips, and fabricated screenshots. SpoProof gives journalists, broadcasters, sports organisations, and fans a **single tool** to instantly verify whether a piece of sports content is authentic — before it spreads.

Unlike generic fact-check tools, SpoProof is purpose-built for sports:

- It knows the difference between **ESPN and a random sports blog**
- It checks whether a **goal celebration actually happened** that day
- It detects whether a **video was manipulated frame by frame**
- It lets you **chat with an AI** about the exact signals that triggered the result

> **"Trust nothing. Verify everything."**

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Google OAuth + Email Auth** | Secure login with per-user credit system |
| 📤 **Multi-format Upload** | Images, videos, screenshots, articles, and direct URLs |
| 📱 **Social Media Extraction** | Paste an Instagram, TikTok, YouTube, Twitter/X, or Facebook URL — we extract and analyse the media automatically |
| 🤖 **Bitmind Deepfake Detection** | 95% accuracy AI model — detects AI-generated and face-swapped images and videos |
| 🔍 **Reverse Image Search** | Finds the image across the web via Zenserp to check provenance |
| 📰 **Sports Fact Check** | Cross-references the content against trusted news sources via Google Custom Search |
| 💬 **Gemini AI Chat** | After verification, chat with Google Gemini about the result — source, signals, what to do next |
| 🏅 **Authenticity Certificates** | Generate downloadable certificates for verified media |
| 🚨 **Alerts Feed** | Platform-wide feed of flagged suspicious sports content |
| 📊 **Reports & History** | Full verification history with filters, search, and JSON download |
| 💳 **Credit System** | Controlled usage — each user gets 10 free credits; each scan costs 1 |

---

## 🔬 The 6-Signal Pipeline

Every piece of submitted media passes through up to **6 independent verification signals** in parallel. Results are combined into a final **Trust Score (0–100)**.

```
Submitted Media (image / video / URL / social)
        │
        ├── ① Source Credibility    → Is the domain on our trusted sports sources whitelist?
        ├── ② Content Hash (pHash)  → Does it match a known authentic or manipulated clip?
        ├── ③ Metadata / EXIF       → Is EXIF data present and consistent?
        ├── ④ Bitmind Deepfake AI   → Is the image/video AI-generated or manipulated?
        ├── ⑤ Reverse Image Search  → Was this image found on trusted or flagged sites?
        └── ⑥ Sports Fact Check     → Do news sources confirm this event happened?
                │
                ▼
        Trust Score = 15 (base) + Σ signal scores   [clamped 0–100]
```

| Score | Status | Meaning |
|-------|--------|---------|
| 🟢 **70–100** | **Verified** | Authentic across all signals — safe to share |
| 🟡 **40–69** | **Suspicious** | Anomalies detected — verify before sharing |
| 🔴 **0–39** | **Fake** | Strong manipulation signals — do not share |

### Signal Score Contributions

| # | Signal | Max Boost | Max Penalty | Powered By |
|---|--------|-----------|-------------|------------|
| 1 | Source Credibility | +40 | 0 | Supabase trusted_sources |
| 2 | Content Hash | +30 | −30 | sharp + internal reference DB |
| 3 | Metadata / EXIF | +15 | −20 | sharp library |
| 4 | Bitmind Deepfake | +20 | −40 | [Bitmind API](https://bitmind.ai) |
| 5 | Reverse Image Search | +20 | −25 | [Zenserp API](https://zenserp.com) |
| 6 | Sports Fact Check | +15 | 0 | Google Custom Search |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** + **Vite** | UI framework and build tool |
| **React Router 6** | Client-side routing with protected routes |
| **Custom CSS** | Design system with dark mission-control aesthetic |
| **Context API** | Global auth state and user management |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 20** + **Express** | REST API server |
| **TypeScript** | Full type safety across all services |
| **Supabase** (PostgreSQL) | Database — 8 tables, migrations, RLS |
| **Redis** | Sliding-window rate limiting per user |
| **multer** | File upload handling (memory storage, 100MB limit) |
| **sharp** | pHash generation + EXIF metadata analysis |
| **ioredis** | Redis client with auto-reconnect |

### External APIs
| API | Purpose | Docs |
|-----|---------|------|
| **Bitmind** | Deepfake + AI content detection | [docs](https://bitmind.ai) |
| **Zenserp** | Reverse image search | [docs](https://zenserp.com) |
| **Google OAuth 2.0** | User authentication | [docs](https://developers.google.com/identity) |
| **Google Gemini 1.5 Flash** | Post-scan AI chat assistant | [docs](https://ai.google.dev) |
| **Google Custom Search** | Sports fact-checking | [docs](https://developers.google.com/custom-search) |
| **yt-dlp** | Social media URL extraction | [docs](https://github.com/yt-dlp/yt-dlp) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│              React + Vite  (Vercel)                         │
│         spoproof.vercel.app                                 │
└────────────────────┬────────────────────────────────────────┘
                     │  HTTPS + JWT Bearer token
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API                             │
│           Node.js + Express + TypeScript (Render)            │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth Routes │  │ Verify Route │  │   App Routes     │  │
│  │ /auth/*     │  │ POST /verify │  │ /dashboard       │  │
│  └─────────────┘  └──────┬───────┘  │ /reports         │  │
│                           │          │ /certificates    │  │
│              ┌────────────▼────────────────────────┐   │  │
│              │        Verification Pipeline         │   │  │
│              │  ① Source  ② Hash  ③ Metadata      │   │  │
│              │  ④ Bitmind ⑤ Zenserp ⑥ Fact Check  │   │  │
│              └────────────┬────────────────────────┘   │  │
└───────────────────────────┼─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│   Supabase   │  │  External APIs   │  │ Redis Cloud  │
│  PostgreSQL  │  │ Bitmind · Zenserp│  │ Rate Limiter │
│  8 tables    │  │ Gemini · Google  │  │ Session Cache│
└──────────────┘  └──────────────────┘  └──────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18.x
- npm ≥ 9.x
- A [Supabase](https://supabase.com) project (free tier works)
- A [Redis Cloud](https://redis.io/try-free) database (free tier works)
- `yt-dlp` installed: `pip install yt-dlp`

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/spoproof.git
cd spoproof
```

### 2. Backend Setup

```bash
cd spoproof-backend

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# Run the database migration
# → Open Supabase SQL Editor
# → Paste the contents of src/config/migrations.sql
# → Click Run

# Start the development server
npm run dev
# Backend running at http://localhost:4000
# Health check: http://localhost:4000/health
```

### 3. Frontend Setup

```bash
cd SpoProof

# Install dependencies
npm install

# Set the API URL
echo "VITE_API_URL=http://localhost:4000/api" > .env

# Start the development server
npm run dev
# Frontend running at http://localhost:5173
```

### 4. Run Both Simultaneously

```bash
# From a root wrapper directory
mkdir spoproof-root && cd spoproof-root
npm init -y
npm install concurrently

# Add to package.json scripts:
# "dev": "concurrently \"cd ../SpoProof && npm run dev\" \"cd ../spoproof-backend && npm run dev\""

npm run dev
```

---

## 🔑 Environment Variables

### Backend (`spoproof-backend/.env`)

```env
# ── Server ──────────────────────────────────────────
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ── Supabase ─────────────────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# ── Redis ────────────────────────────────────────────
REDIS_URL=redis://:password@host:port

# ── Auth & JWT ───────────────────────────────────────
JWT_SECRET=your-64-char-random-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# ── AI & Search APIs ─────────────────────────────────
BITMIND_API_KEY=bitmind-xxxx-xxxx          # Already provided
ZENSERP_API_KEY=xxxx-xxxx-xxxx             # Already provided
GEMINI_API_KEY=your-gemini-api-key         # aistudio.google.com
GOOGLE_SEARCH_API_KEY=your-key             # console.cloud.google.com
GOOGLE_SEARCH_CX=your-cx-id               # cse.google.com

# ── Credits ──────────────────────────────────────────
DEFAULT_CREDITS=10
VERIFY_CREDIT_COST=1
GEMINI_CHAT_CREDIT_COST=1
MAX_FILE_SIZE_MB=100
```

### Frontend (`SpoProof/.env`)

```env
VITE_API_URL=http://localhost:4000/api
```

> **Where to get the keys:**
> - Google OAuth → [console.cloud.google.com](https://console.cloud.google.com) → Credentials → OAuth 2.0
> - Gemini → [aistudio.google.com](https://aistudio.google.com) → Get API Key
> - Google Custom Search → [cse.google.com](https://cse.google.com) → Create engine → grab CX

---

## 📡 API Reference

**Base URL:** `http://localhost:4000/api` (local) or your Railway URL (production)

All protected routes require: `Authorization: Bearer <jwt_token>`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/auth/google` | ❌ | Redirect to Google OAuth |
| `GET` | `/auth/google/callback` | ❌ | OAuth callback — issues JWT |
| `POST` | `/auth/register` | ❌ | `{ name, email, password }` |
| `POST` | `/auth/login` | ❌ | `{ email, password }` |
| `GET` | `/auth/me` | ✅ | Current user + credits |
| `PATCH` | `/auth/me` | ✅ | Update profile |

### Verification

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/verify` | ✅ 1 credit | Multipart `file` or JSON `{ url, type }` |
| `GET` | `/verify/:id` | ✅ | Get result by ID |

### Example Request

```bash
# Verify by URL
curl -X POST http://localhost:4000/api/verify \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.espn.com/nba/story/_/id/123456", "type": "url"}'

# Verify by file upload
curl -X POST http://localhost:4000/api/verify \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "file=@/path/to/image.jpg"
```

### Example Response

```json
{
  "success": true,
  "creditsRemaining": 9,
  "data": {
    "id": "uuid-here",
    "status": "Verified",
    "trustScore": 85,
    "mediaType": "image",
    "metrics": {
      "authenticity": 85,
      "sourceMatch": 92,
      "tamperRisk": 8,
      "aiProbability": 4,
      "metadataStatus": "Clean"
    },
    "signals": {
      "source":      { "verdict": "verified",          "score": 40, "reason": "Verified source: ESPN" },
      "hash":        { "verdict": "no_match",           "score": 0,  "reason": "No match in reference DB" },
      "metadata":    { "verdict": "present",            "score": 15, "reason": "Metadata present and consistent" },
      "deepfake":    { "verdict": "likely_authentic",   "score": 20, "reason": "Bitmind: authentic (94% confidence)" },
      "reverseImage":{ "verdict": "original_found",     "score": 20, "reason": "Original found on ESPN" },
      "factCheck":   { "verdict": "confirmed",          "score": 15, "reason": "3 trusted sources confirm this event" }
    },
    "recommendation": "Content appears authentic across all verification signals. Safe to share.",
    "createdAt": "2026-04-28T12:00:00.000Z"
  }
}
```

### All Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard` | Stats + 10 recent verifications |
| `GET` | `/reports` | `?status=&search=&page=&limit=` |
| `GET` | `/reports/:id/download` | Download verification as JSON |
| `GET` | `/certificates` | All user certificates |
| `POST` | `/certificates` | Generate cert (status must be Verified) |
| `GET` | `/certificates/:id/download` | Download certificate |
| `GET` | `/alerts` | Platform alerts feed |
| `PATCH` | `/alerts/:id/read` | Mark alert as read |
| `GET` | `/settings` | User preferences |
| `PATCH` | `/settings` | Update preferences |
| `POST` | `/settings/password` | Change password |
| `GET` | `/credits` | Balance + ledger history |
| `POST` | `/gemini/chat` | `{ verificationId, message, history }` → AI reply |

---

## 📁 Project Structure

```
spoproof/
├── SpoProof/                          ← Frontend (React + Vite)
│   ├── src/
│   │   ├── lib/api.js                 ← All API calls — single source of truth
│   │   ├── context/AuthContext.jsx    ← Global auth state + JWT management
│   │   ├── components/
│   │   │   ├── AppLayout.jsx          ← Sidebar + topbar with credits counter
│   │   │   └── ProtectedRoute.jsx     ← Auth guard for /app/* routes
│   │   └── pages/
│   │       ├── AuthPage.jsx           ← Google OAuth + email login/register
│   │       ├── AuthCallbackPage.jsx   ← Google redirect handler
│   │       ├── DashboardPage.jsx      ← Stats + activity table
│   │       ├── VerifyPage.jsx         ← Upload zone + URL input
│   │       ├── ResultPage.jsx         ← Result + Gemini chat panel
│   │       ├── ReportsPage.jsx        ← Verification history
│   │       ├── CertificatesPage.jsx   ← Certificate manager
│   │       ├── AlertsPage.jsx         ← Platform alerts feed
│   │       └── SettingsPage.jsx       ← Profile / notifications / security
│   └── .env                           ← VITE_API_URL
│
└── spoproof-backend/                  ← Backend (Node.js + Express + TS)
    ├── src/
    │   ├── index.ts                   ← App entry point
    │   ├── routes/index.ts            ← All routes in one file
    │   ├── controllers/
    │   │   ├── authController.ts      ← OAuth + email auth + profile
    │   │   ├── verifyController.ts    ← Core verification orchestrator
    │   │   ├── geminiController.ts    ← AI chat with credit deduction
    │   │   └── appController.ts       ← Dashboard, reports, certs, alerts
    │   ├── services/
    │   │   ├── sourceChecker.ts       ← Signal 1: Domain trust check
    │   │   ├── mediaAnalyser.ts       ← Signal 2+3: pHash + EXIF
    │   │   ├── bitmindService.ts      ← Signal 4: Deepfake detection
    │   │   ├── reverseImageSearch.ts  ← Signal 5: Zenserp API
    │   │   ├── factCheckService.ts    ← Signal 6: Google Search
    │   │   ├── socialExtractor.ts     ← yt-dlp social URL extraction
    │   │   ├── geminiService.ts       ← Gemini chat with context
    │   │   ├── scoringEngine.ts       ← Combines signals → final result
    │   │   └── creditService.ts       ← Credit deduction + ledger
    │   ├── middleware/
    │   │   ├── auth.ts                ← requireAuth + requireCredits
    │   │   ├── rateLimiter.ts         ← Redis sliding-window limiter
    │   │   └── upload.ts              ← Multer 100MB memory storage
    │   ├── config/
    │   │   ├── supabase.ts            ← Supabase client (service role)
    │   │   ├── redis.ts               ← Redis client
    │   │   └── migrations.sql         ← Full DB schema — run in Supabase
    │   ├── types/index.ts             ← All TypeScript interfaces
    │   └── utils/jwt.ts               ← Custom HS256 JWT
    └── .env.example                   ← Template for all env vars
```

---

## 🌐 Deployment

### Backend → Railway

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "initial" && git push

# 2. railway.app → New Project → Deploy from GitHub
# 3. Add all env vars in Railway → Variables tab
# 4. Add nixpacks.toml for yt-dlp:
```

**`nixpacks.toml`** (place in backend root):
```toml
[phases.setup]
nixPkgs = ["yt-dlp", "ffmpeg"]

[phases.install]
cmds = ["npm install"]

[start]
cmd = "npm start"
```

### Frontend → Vercel

```bash
# 1. Push to GitHub (separate repo)
# 2. vercel.com → New Project → Import → select frontend repo
# 3. Framework: Vite | Build: npm run build | Output: dist
# 4. Add env var: VITE_API_URL = https://your-railway-url.up.railway.app/api
# 5. Deploy
```

### Google OAuth — Production

Add to **Authorized redirect URIs** in Google Cloud Console:
```
https://your-railway-url.up.railway.app/api/auth/google/callback
```

Add to **Authorized JavaScript origins**:
```
https://spoproof.vercel.app
```

---

## 🗺️ Roadmap

- [x] Google OAuth + email authentication
- [x] Per-user credit system with ledger
- [x] 6-signal verification pipeline
- [x] Bitmind deepfake detection (image + video)
- [x] Social media URL extraction (Instagram, TikTok, YouTube, Twitter/X)
- [x] Reverse image search via Zenserp
- [x] Sports fact-check via Google Custom Search
- [x] Gemini AI post-scan chat
- [x] Authenticity certificates
- [x] Platform alerts feed
- [x] Redis rate limiting per user
- [ ] Phase 6 — Side-by-side comparison mode with visual diff overlay
- [ ] Phase 7 — Async deep scan with job queue + WebSocket progress
- [ ] Browser extension for one-click verification
- [ ] Public API with developer keys
- [ ] Organisation accounts with team dashboards
- [ ] Video timeline manipulation heatmap

---

## 🤝 Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
# Fork → Clone → Create branch
git checkout -b feature/your-feature-name

# Make changes → Commit
git commit -m "feat: add your feature"

# Push → Open Pull Request
git push origin feature/your-feature-name
```

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

## 🙏 Acknowledgements

- [Bitmind](https://bitmind.ai) — Deepfake detection API
- [Zenserp](https://zenserp.com) — Reverse image search
- [Supabase](https://supabase.com) — Open source Firebase alternative
- [Google Gemini](https://ai.google.dev) — AI chat
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — Media extraction from social platforms
- [Render](https://render.app) — Backend hosting
- [Vercel](https://vercel.com) — Frontend hosting

---

<div align="center">

**Built with care for integrity in sports media.**

⭐ Star this repo if SpoProof helped you — it means a lot.

[![GitHub stars](https://img.shields.io/github/stars/yourusername/spoproof?style=social)](https://github.com/yourusername/spoproof)

</div>
