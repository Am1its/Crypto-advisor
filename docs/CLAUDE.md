# Moveo AI Crypto Advisor — Project Documentation

## Overview

A personalized crypto investor dashboard. Users complete an onboarding quiz, then see a daily AI-curated dashboard with live data across **8 widgets**. Each section supports thumbs up/down voting stored in the DB. Users can edit their profile, reorder and resize their dashboard widgets, and reset their password via email.

## Features

- **8 Dashboard Widgets** — rendered in a fixed 12-column CSS Grid that fills exactly one viewport height (no page scroll):
  1. **Coin Prices** — live prices, 24h change, 7-day sparkline charts, sortable by price/change
  2. **Market News** — latest posts from Reddit r/CryptoCurrency with per-article voting
  3. **AI Insight of the Day** — OpenRouter AI-generated insight with source attribution badge
  4. **Fun Crypto Meme** — random post from Reddit r/cryptocurrencymemes
  5. **Fear & Greed Index** — animated semicircle gauge from Alternative.me
  6. **$1,000 ROI Calculator** — shows what $1,000 invested 1 year ago is worth today per coin
  7. **Trending NFTs** — top NFT collections by 24h floor price change
  8. **Whale Alerts** — simulated large on-chain transfer alerts
- **Premium Dashboard OS Layout** — `h-dvh overflow-hidden` root, 12-column CSS Grid with `grid-template-rows: repeat(3, 1fr)` and `grid-auto-flow: dense`; each widget fills exactly 1/3 of the viewport height with internal `overflow-y-auto` scrolling
- **Animated Mesh Gradient Background** — 3 CSS `@keyframes` blob divs (violet/amber/sky) with `blur-[130px]`, drifting on 18–30s loops; subtle grid overlay at 1.8% opacity
- **Glassmorphism Cards** — `rgba(6,6,16,0.76)` background with `backdrop-blur(28px)`, per-widget colored border and outer `box-shadow` glow; 2px gradient accent bar on top of each card
- **Widget Sizing** — users choose S (3 cols / ¼ width), M (6 cols / ½ width), or L (12 cols / full row) for each widget in Profile; stored as `widget_sizes JSONB` in the DB and consumed by the dashboard grid
- **Inter Font** — loaded via Google Fonts; applied globally via `index.html` `<style>` block
- **Skeleton Loaders** — 8 glass-style `animate-pulse` skeletons in the grid matching the default widget positions during load
- **Slow Load Indicator** — compact spinning icon + text appears inline in the header after 8 seconds of loading
- **Stale Price Badge** — `APPROX` chip in the Prices card header when static fallback prices are being shown
- **API Resilience** — `fetchWithTimeout()` (8s AbortController) on all 7 external calls; stale-cache fallback; static price table as last resort
- **Toast Notifications** — `react-hot-toast` with dark amber theme on profile save, password change, and signup
- **Drag & Drop Widget Ordering** — `@hello-pangea/dnd` in Profile lets users drag selected content types into a custom order
- **Widget Size Editor** — "Edit sizes" toggle in Profile reveals S/M/L buttons per widget with color-coded accent matching the widget's theme
- **Thumbs Up/Down Voting** — optimistic UI updates with DB persistence; per-article for news, per-section for other widgets
- **JWT Auth** — 7-day tokens, bcrypt password hashing, protected routes
- **Password Reset** — token-based email flow via Resend API (demo mode shows URL in browser when no key)
- **Emoji Avatars** — 16 crypto-themed emoji avatars selectable during onboarding and from the profile page
- **Multi-step Onboarding** — 4-step flow with progress indicator and CSS fade/slide transitions between steps
- **Glassmorphism Auth Pages** — Login, Signup, and Onboarding use `MeshBackground` + glass card design matching the dashboard aesthetic
- **Dark/Light Theme Toggle** — Profile header toggle (Sun/Moon); applies `.dark`/`.light` class to `<html>`; persisted to localStorage; flicker-free via inline `<head>` script
- **Email Validation** — frontend regex on blur in Signup.jsx; backend regex in auth.js register route; returns 400 with clear error message
- **Price Alerts** — users set price thresholds per coin; `node-cron` checks every 10 minutes; Resend sends HTML alert email; alerts auto-deactivate after triggering

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
| Font       | Inter (Google Fonts)              |

---

## Project Structure

```
moveo-crypto-advisor/
├── client/
│   ├── index.html                 # Inter font import + global font/scrollbar styles
│   ├── src/
│   │   ├── api/client.js          # axios instance, auto-attaches JWT
│   │   ├── components/
│   │   │   └── MeshBackground.jsx # Animated blob background; light prop for auth pages
│   │   └── pages/
│   │       ├── Login.jsx          # Glassmorphism redesign with MeshBackground
│   │       ├── Signup.jsx         # Glassmorphism + inline email validation
│   │       ├── Onboarding.jsx     # 4-step flow with progress indicator + fade transitions
│   │       ├── Dashboard.jsx      # Premium OS layout, glass cards, 12-col grid, alert modal
│   │       ├── Profile.jsx        # Drag order + widget sizes + dark/light toggle
│   │       ├── ForgotPassword.jsx
│   │       └── ResetPassword.jsx
│   ├── vite.config.js             # Tailwind plugin + /api proxy
│   └── vercel.json                # SPA rewrite rule
├── server/
│   ├── db/
│   │   ├── index.js               # pg Pool (SSL-aware)
│   │   ├── init.js                # migration: users, preferences (+ widget_sizes), votes
│   │   └── migrate-reset-tokens.js # migration: password_reset_tokens
│   ├── middleware/
│   │   └── auth.js                # JWT verification → req.user
│   ├── routes/
│   │   ├── auth.js                # register (+ email validation), login, forgot/reset password
│   │   ├── onboarding.js          # save preferences (first login)
│   │   ├── dashboard.js           # parallel fetch + fetchWithTimeout + fallbacks
│   │   ├── votes.js               # thumbs up/down
│   │   ├── profile.js             # get/update user + preferences + widget_sizes
│   │   └── alerts.js              # GET/POST/DELETE price alerts (JWT-protected)
│   ├── cron/
│   │   └── priceAlerts.js         # node-cron every 10min; checks alerts; sends Resend email
│   ├── data/memes.js              # Reddit fetch + static fallback
│   ├── .env.example
│   └── server.js                  # mounts alerts router, starts cron, runs startup migrations
└── docs/
    ├── CLAUDE.md
    └── AI_INTERACTIONS.md
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
| Column        | Type    | Notes                                          |
|---------------|---------|------------------------------------------------|
| id            | SERIAL  | Primary key                                    |
| user_id       | INT     | FK → users (CASCADE)                           |
| crypto_assets | TEXT[]  | e.g. `['BTC', 'ETH']`                         |
| investor_type | TEXT    | HODLer / Day Trader / NFT Collector            |
| content_types | TEXT[]  | Ordered list e.g. `['Charts', 'Market News']`  |
| widget_sizes  | JSONB   | e.g. `{"Charts":"M","Whale Alerts":"L"}`       |

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

### price_alerts
| Column       | Type      | Notes                                    |
|--------------|-----------|------------------------------------------|
| id           | SERIAL    | Primary key                              |
| user_id      | INT       | FK → users (CASCADE)                     |
| coin_id      | TEXT      | CoinGecko slug e.g. `bitcoin`            |
| target_price | NUMERIC   | USD threshold                            |
| is_above     | BOOLEAN   | TRUE = alert when price ≥ target         |
| is_active    | BOOLEAN   | FALSE after triggered; Default true      |
| created_at   | TIMESTAMP | Default now()                            |

---

## Dashboard Grid System

The dashboard uses a fixed-height 12-column CSS Grid with no page scroll.

### Layout formula
```
Container:  h-dvh overflow-hidden flex flex-col
Header:     h-14 flex-shrink-0  (glassmorphism, backdrop-blur)
Main:       flex-1 overflow-hidden p-3
Grid:       h-full grid grid-cols-12 gap-3
            grid-template-rows: repeat(3, 1fr)
            grid-auto-flow: dense
```

### Default widget positions (all 8 active, default sizes)
| Row | Widgets | Column spans |
|-----|---------|-------------|
| 1   | Coin Prices + Market News | 6 + 6 = 12 |
| 2   | AI Insight + Meme + Fear & Greed + ROI | 3 + 3 + 3 + 3 = 12 |
| 3   | NFT Showcase + Whale Alerts | 6 + 6 = 12 |

### Widget size options
| Size | Columns | Width    |
|------|---------|----------|
| S    | 3       | ¼ screen |
| M    | 6       | ½ screen |
| L    | 12      | Full row |

Row span is always 1 (1/3 of viewport height). Content inside each card scrolls with `overflow-y-auto`.

### Widget theming
Each widget has a unique accent color used for the border glow, card header label, top accent bar, and size button highlight in Profile:

| Widget          | Accent  |
|-----------------|---------|
| Coin Prices     | #F59E0B (amber)  |
| Market News     | #38BDF8 (sky)    |
| AI Insight      | #A78BFA (violet) |
| Meme            | #FB7185 (rose)   |
| Fear & Greed    | #F97316 (orange) |
| ROI Calculator  | #34D399 (emerald)|
| NFT Showcase    | #EC4899 (pink)   |
| Whale Alerts    | #EF4444 (red)    |

---

## API Resilience Architecture

All external HTTP calls use a `fetchWithTimeout()` wrapper with an 8-second `AbortController` timeout, preventing any single stalled request from hanging the entire dashboard response.

### Price fetch waterfall
```
1. CoinGecko /coins/markets  (primary, with API key, sparkline=true)
       ↓ fails (429 / timeout)
2. CoinGecko /simple/price   (fallback, with API key)
       ↓ fails
3. _priceCache               (stale in-memory cache, any age)
       ↓ no cache exists
4. STATIC_PRICE_FALLBACK     (hardcoded approximate prices, marked _stale:true)
```

When `_stale: true` prices are served, the frontend shows an `APPROX` badge in the Prices card header.

### Cache TTLs
| Data          | TTL        |
|---------------|------------|
| Prices        | 5 minutes  |
| Fear & Greed  | 15 minutes |
| Historical (ROI) | 24 hours |
| NFTs          | 5 minutes  |

---

## External APIs

| Purpose      | API                                                | Key required | Fallback                              |
|--------------|----------------------------------------------------|--------------|---------------------------------------|
| Coin prices  | CoinGecko `/coins/markets`                         | Demo key     | `/simple/price` → stale cache → static table |
| News         | Reddit r/CryptoCurrency JSON API                   | None         | Static mock headlines                 |
| AI Insight   | OpenRouter `liquid/lfm-2.5-1.2b-instruct:free`    | Yes          | 3 rotating tips per investor type     |
| Memes        | Reddit r/cryptocurrencymemes                       | None         | Static curated array                  |
| Fear & Greed | Alternative.me `/fng`                              | None         | Static value (58, "Greed")            |
| Historical   | CoinGecko `/coins/{id}/history`                    | Demo key     | Skips ROI entry for that coin         |
| NFTs         | CoinGecko `/search/trending`                       | Demo key     | Static NFT fallback array             |
| Email        | Resend API                                         | Yes          | Reset URL shown on screen             |

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
| GET  | `/api/dashboard` | Yes | Fetch all 8 widgets in parallel; returns `widgetSizes` |
| POST | `/api/votes` | Yes | Submit thumbs up/down |
| GET  | `/api/profile` | Yes | Fetch user + preferences + widget_sizes |
| PUT  | `/api/profile` | Yes | Update name, preferences, content_types order, widget_sizes |
| PUT  | `/api/profile/password` | Yes | Change password (bcrypt verify + rehash) |
| GET  | `/api/alerts` | Yes | List active price alerts for user |
| POST | `/api/alerts` | Yes | Create a new price alert |
| DELETE | `/api/alerts/:id` | Yes | Deactivate a price alert |
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
RESEND_API_KEY=your_key        # also used for price alert emails
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
npm run migrate        # creates tables + adds widget_sizes column if missing
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

> After deploying, run `npm run migrate` once on the server to add the `widget_sizes` column to existing databases.

---

## Ideas for Future Improvements

### High priority
- [ ] **Portfolio tracker** — user enters coin holdings, dashboard shows total USD value and P&L
- [x] **Price alerts** ✅ — `price_alerts` table; `node-cron` polls every 10 min; Resend email on trigger; modal UI in Prices card
- [ ] **Persistent avatar** — save `avatarEmoji` to the DB (currently only in localStorage; clears on new device/login)
- [ ] **Email verification on signup** — send a verification link via Resend before allowing login
- [x] **Change password from profile** ✅
- [x] **Widget drag-and-drop ordering** ✅
- [x] **Widget size control (S/M/L)** ✅

### Medium priority
- [ ] **Historical price chart** — click a coin row to expand a 7/30-day chart (CoinGecko `/coins/{id}/market_chart` + Recharts)
- [ ] **News pagination** — "Load more" button or infinite scroll on the news card
- [x] **Dark/light theme toggle** ✅ — toggle in Profile; `.dark`/`.light` on `<html>`; localStorage; flicker-free script in `<head>`
- [ ] **Arbitrary widget grid positioning** — drag widgets to specific grid coordinates (requires collision detection)

### Low priority / polish
- [ ] **Admin analytics view** — table of vote data, most/least liked content per section
- [ ] **Onboarding re-entry guard** — if user already has preferences, skip onboarding

---

## Known Issues & Problems

### Solved ✅
- **Port 5000 blocked by macOS AirPlay** → switched to port 3001
- **Vercel 404 on `/login`, `/signup` etc.** → added `client/vercel.json` SPA rewrite rule
- **`VITE_API_URL` not baked into Vercel build** → env vars must be set before build; requires manual redeploy
- **DB SSL on Render** → Render doesn't set `NODE_ENV=production`; fixed by checking if `DATABASE_URL` contains `localhost`
- **CoinGecko rate limiting** → 5-minute in-memory cache + authenticated fallback + stale cache + static price table as last resort
- **OpenRouter model deprecated** (`meta-llama/llama-3.1-8b-instruct:free`) → switched to `liquid/lfm-2.5-1.2b-instruct:free`
- **CryptoPanic free tier discontinued** → replaced with Reddit r/CryptoCurrency JSON API (no key required)
- **Fallback AI insight always returned the same text** → expanded to 3 rotating tips per investor type
- **Dashboard loading hanging for 20+ minutes** → `fetchWithTimeout()` (8s AbortController) on all 7 external API calls
- **Blank prices on first load when CoinGecko unreachable** → `STATIC_PRICE_FALLBACK` table with approximate prices; marked `_stale:true` so UI shows `APPROX` badge
- **No user feedback on long loads** → slow-load spinner in header after 8 seconds
- **Masonry layout caused uneven heights and column orphans** → replaced with 12-col CSS Grid + `grid-auto-flow: dense` for pixel-perfect packing
- **Page scrolled past viewport** → `h-dvh overflow-hidden` root; all content fits in one screen

### Unresolved ⚠️
- **Avatar emoji not persisted to DB** — stored only in localStorage; switching devices or re-logging in loses the selection
- **CoinGecko sparkline unavailable on fallback path** — `/simple/price` doesn't return 7-day data; sparkline hidden when primary endpoint is rate-limited
- **Render free tier cold start** — first request after inactivity takes ~30 seconds; no keep-alive ping configured
- **Oversized widgets clip off-screen** — if a user sets too many widgets to "L" (full row), lower widgets overflow the 3-row grid and are hidden by `overflow-hidden`

---

## Bonus: Feedback Loop & Model Training Suggestion

**TL;DR:** Votes (thumbs up/down) stored per user per content item form a labeled dataset:

1. **Feature engineering** — encode `(user_preferences, content_metadata)` as vectors
2. **Model** — train a ranking model to predict `P(vote=up | user, content)`
3. **Re-ranking** — use scores to surface content each user is more likely to upvote
4. **Retraining** — weekly batch job; deploy only if new model beats baseline on held-out set
5. **Cold start** — new users fall back to global popularity until vote history accumulates
