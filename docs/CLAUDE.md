# Moveo AI Crypto Advisor — Project Documentation

## Overview

A personalized crypto investor dashboard. Users complete an onboarding quiz, then see a daily AI-curated dashboard with live data across **8 widgets**. Each section supports thumbs up/down voting stored in the DB. Users can edit their profile, reorder their dashboard widgets, and reset their password via email.

## Features

- **8 Dashboard Widgets** — rendered in a responsive CSS Masonry layout (3-column on XL, 2-column on MD, 1-column on mobile):
  1. **Coin Prices** — live prices, 24h change, 7-day sparkline charts, sortable by price/change
  2. **Market News** — latest posts from Reddit r/CryptoCurrency with per-article voting
  3. **AI Insight of the Day** — OpenRouter AI-generated insight with source attribution badge
  4. **Fun Crypto Meme** — random post from Reddit r/cryptocurrencymemes
  5. **Fear & Greed Index** — animated semicircle gauge from Alternative.me
  6. **$1,000 ROI Calculator** — shows what $1,000 invested 1 year ago is worth today per coin
  7. **Trending NFTs** — top NFT collections by 24h floor price change
  8. **Whale Alerts** — simulated large on-chain transfer alerts
- **Masonry Layout** — CSS `columns` for a Pinterest-style staggered grid; cards have `break-inside-avoid`
- **Skeleton Loaders** — 6 shape-accurate `animate-pulse` skeletons render in the same grid on load to prevent layout shift
- **Toast Notifications** — `react-hot-toast` with dark amber theme on profile save, password change, and signup
- **Drag & Drop Widget Ordering** — `@hello-pangea/dnd` in the Profile page lets users drag selected content types into a custom order; Dashboard renders widgets in exactly that order; unselected types shown as clickable chips to add
- **Thumbs Up/Down Voting** — optimistic UI updates with DB persistence; per-article for news, per-section for other widgets
- **JWT Auth** — 7-day tokens, bcrypt password hashing, protected routes
- **Password Reset** — token-based email flow via Resend API (demo mode shows URL in browser when no key)
- **Emoji Avatars** — 12 crypto-themed emoji avatars selectable during onboarding and from the profile page

---

## Live URLs

| | URL |
|---|---|
| Frontend | https://crypto-advisor-seven.vercel.app |
| Backend | https://crypto-advisor-4f6g.onrender.com |
| GitHub | https://github.com/Am1its/Crypto-advisor |
| Database | Neon PostgreSQL (eu-central-1) |

---

## Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React (Vite) + Tailwind CSS v4    |
| Backend    | Node.js + Express v5              |
| Database   | PostgreSQL (Neon serverless)      |
| Auth       | JWT (7 day expiry) + bcrypt       |
| Email      | Resend API                        |
| Deployment | Vercel (FE) + Render (BE)         |
| Toasts     | react-hot-toast                   |

---

## Project Structure

```
moveo-crypto-advisor/
├── client/
│   ├── src/
│   │   ├── api/client.js          # axios instance, auto-attaches JWT
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── Onboarding.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Profile.jsx
│   │       ├── ForgotPassword.jsx
│   │       └── ResetPassword.jsx
│   ├── vite.config.js             # Tailwind plugin + /api proxy
│   └── vercel.json                # SPA rewrite rule
├── server/
│   ├── db/
│   │   ├── index.js               # pg Pool (SSL-aware)
│   │   ├── init.js                # migration: users, preferences, votes
│   │   └── migrate-reset-tokens.js # migration: password_reset_tokens
│   ├── middleware/
│   │   └── auth.js                # JWT verification → req.user
│   ├── routes/
│   │   ├── auth.js                # register, login, forgot/reset password
│   │   ├── onboarding.js          # save preferences (first login)
│   │   ├── dashboard.js           # parallel data fetch (prices/news/ai/meme)
│   │   ├── votes.js               # thumbs up/down
│   │   └── profile.js             # get/update user + preferences
│   ├── data/memes.js              # Reddit fetch + static fallback
│   ├── .env.example
│   └── server.js
└── CLAUDE.md
```

---

## Database Schema

### users
| Column     | Type      | Notes           |
|------------|-----------|-----------------|
| id         | SERIAL    | Primary key     |
| email      | TEXT      | Unique NOT NULL |
| name       | TEXT      |                 |
| password   | TEXT      | bcrypt hashed   |
| created_at | TIMESTAMP | Default now()   |

### preferences
| Column        | Type    | Notes                       |
|---------------|---------|-----------------------------|
| id            | SERIAL  | Primary key                 |
| user_id       | INT     | FK → users (CASCADE)        |
| crypto_assets | TEXT[]  | e.g. ['BTC', 'ETH']        |
| investor_type | TEXT    | HODLer / Day Trader / etc.  |
| content_types | TEXT[]  | Market News / Charts / etc. |

### votes
| Column     | Type      | Notes                              |
|------------|-----------|------------------------------------|
| id         | SERIAL    | Primary key                        |
| user_id    | INT       | FK → users (CASCADE)               |
| section    | TEXT      | 'prices' / 'news' / 'ai' / 'meme' |
| item_id    | TEXT      | Specific item identifier           |
| vote       | TEXT      | 'up' / 'down'                      |
| created_at | TIMESTAMP | Default now()                      |

### password_reset_tokens
| Column     | Type      | Notes                    |
|------------|-----------|--------------------------|
| id         | SERIAL    | Primary key              |
| user_id    | INT       | FK → users (CASCADE)     |
| token      | TEXT      | Unique, random 32 bytes  |
| expires_at | TIMESTAMP | 1 hour from creation     |
| used       | BOOLEAN   | Default false            |
| created_at | TIMESTAMP | Default now()            |

---

## External APIs

| Purpose     | API                              | Key required | Fallback                    |
|-------------|----------------------------------|--------------|-----------------------------|
| Coin prices | CoinGecko `/coins/markets`       | Demo key     | Shows `–` symbols           |
| News        | Reddit r/CryptoCurrency JSON API | None         | Static mock headlines       |
| AI Insight  | OpenRouter `liquid/lfm-2.5-1.2b-instruct:free` | Yes | Static tips per investor type |
| Memes       | Reddit r/cryptocurrencymemes     | None         | Static curated array        |
| Email       | Resend API                       | Yes          | Reset URL shown on screen   |

---

## Pages & Routes

| Path | Page | Protected |
|------|------|-----------|
| `/login` | Login | No |
| `/signup` | Signup | No |
| `/forgot-password` | Forgot Password | No |
| `/reset-password/:token` | Reset Password | No |
| `/onboarding` | Onboarding Quiz | Yes |
| `/dashboard` | Main Dashboard | Yes |
| `/profile` | Edit Profile | Yes |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register, returns JWT |
| POST | `/api/auth/login` | No | Login, returns JWT |
| POST | `/api/auth/forgot-password` | No | Generate reset token, send email |
| POST | `/api/auth/reset-password` | No | Verify token, update password |
| POST | `/api/onboarding` | Yes | Save/update preferences |
| GET  | `/api/dashboard` | Yes | Fetch all 4 sections in parallel |
| POST | `/api/votes` | Yes | Submit thumbs up/down |
| GET  | `/api/profile` | Yes | Fetch user + preferences |
| PUT  | `/api/profile` | Yes | Update name + preferences |
| GET  | `/health` | No | Server health check |

---

## Environment Variables (server/.env)

```
PORT=3001
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://...
JWT_SECRET=your_long_random_secret
COINGECKO_API_KEY=your_demo_key
OPENROUTER_API_KEY=your_key
RESEND_API_KEY=your_key
```

> Note: Port 5000 is reserved by macOS AirPlay — use 3001 locally.

---

## Setup & Running Locally

```bash
git clone https://github.com/Am1its/Crypto-advisor.git
cd Crypto-advisor

# Backend
cd server
cp .env.example .env   # fill in keys
npm install
npm run migrate        # create tables
npm run dev            # http://localhost:3001

# Frontend (new terminal)
cd ../client
npm install
npm run dev            # http://localhost:5173
```

---

## Deployment

| Service | Config |
|---------|--------|
| **Vercel** | Root dir: `client`, env: `VITE_API_URL=https://crypto-advisor-4f6g.onrender.com` |
| **Render** | Root dir: `server`, build: `npm install`, start: `node server.js` |

Render env vars needed: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `COINGECKO_API_KEY`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`

---

## Ideas for Future Improvements

### High priority (next sessions)
- [ ] **Portfolio tracker** — user enters coin holdings, dashboard shows total USD value and P&L
- [ ] **Price alerts** — user sets a threshold; server polls CoinGecko and emails via Resend when crossed
- [ ] **Persistent avatar** — save `avatarEmoji` to the DB (currently only in localStorage; clears on new device/login)
- [ ] **Email verification on signup** — send a verification link via Resend before allowing login
- [x] **Change password from profile** — `PUT /api/profile/password` + Change Password section in Profile page ✅

### Medium priority
- [ ] **Historical price chart** — click a coin row to expand a 7/30-day chart using CoinGecko `/coins/{id}/market_chart` + a lightweight chart library (e.g. Recharts)
- [ ] **News pagination** — "Load more" button or infinite scroll on the news card
- [ ] **Dark/light theme toggle** — persist preference in localStorage

### Low priority / polish
- [ ] **Admin analytics view** — table of vote data, most/least liked content per section
- [ ] **Onboarding re-entry guard** — if user already has preferences, skip onboarding and go straight to dashboard

---

## Known Issues & Problems

### Solved ✅
- **Port 5000 blocked by macOS AirPlay** → switched to port 3001
- **Vercel 404 on `/login`, `/signup` etc.** → added `client/vercel.json` SPA rewrite rule
- **`VITE_API_URL` not baked into Vercel build** → env vars must be set before build; requires manual redeploy
- **DB SSL on Render** → Render doesn't set `NODE_ENV=production`; fixed by checking if `DATABASE_URL` contains `localhost`
- **CoinGecko rate limiting on Render's shared IPs** → added 90-second in-memory cache + `/simple/price` fallback + hardcoded coin images so logos always show even without live data
- **OpenRouter model deprecated** (`meta-llama/llama-3.1-8b-instruct:free`) → switched to `liquid/lfm-2.5-1.2b-instruct:free`
- **CryptoPanic free tier discontinued** → replaced with Reddit r/CryptoCurrency JSON API (no key required)
- **Fallback AI insight always returned the same text** → expanded to 3 rotating tips per investor type
- **Basic loading spinner gave no content shape preview** → replaced with 4 shape-accurate skeleton loaders (Prices, News, AI Insight, Meme) using `animate-pulse`; rendered inline in the same 2×2 grid so layout doesn't shift on load
- **No user feedback on profile saves or password changes** → added `react-hot-toast` with dark amber theme; success/error toasts fire on profile save, password update, and signup
- **CoinGecko rate limiting on Render's shared IPs** → Implemented a robust 5-minute in-memory cache, added the `x-cg-demo-api-key` header to the `/simple/price` fallback endpoint, and engineered a "stale cache fallback" mechanism. This ensures that even if both endpoints return 429 errors, the UI gracefully degrades by displaying the last known prices rather than crashing or showing null values.

### Unresolved ⚠️
- **Avatar emoji not persisted to DB** — stored only in localStorage; switching devices or re-logging in loses the selection
- **CoinGecko sparkline data unavailable on fallback path** — when `/coins/markets` is rate-limited and we fall back to `/simple/price`, the 7-day sparkline is not returned; coin rows show no chart in that case
- **Render free tier cold start** — first request after inactivity takes ~30 seconds; no keep-alive ping configured

---

## Bonus: Feedback Loop & Model Training Suggestion

**TL;DR:** Votes (thumbs up/down) stored per user per content item form a labeled dataset:

1. **Feature engineering** — encode `(user_preferences, content_metadata)` as vectors
2. **Model** — train a ranking model to predict `P(vote=up | user, content)`
3. **Re-ranking** — use scores to surface content each user is more likely to upvote
4. **Retraining** — weekly batch job; deploy only if new model beats baseline on held-out set
5. **Cold start** — new users fall back to global popularity until vote history accumulates
