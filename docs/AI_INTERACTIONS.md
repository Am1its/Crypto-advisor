# AI Interaction Summary — Moveo Coding Task

This document summarizes how Claude Code and Gemini was used during the development of this project, as required by the Moveo assignment deliverables.

---

## Tool Used

**Claude Code** (claude-sonnet-4-6) — Anthropic's AI-powered CLI assistant, used interactively throughout the entire development process.
**Google Gemini** — Google's advanced AI assistant, used for targeted UI/UX refinements, logical debugging, and manual collaborative coding. 

---

## Interaction Log

### Session 1 — Project Planning & Setup (2026-05-08)

**What I asked:**
- Read and understand the Moveo coding task PDF
- Discuss tech stack choices (frontend, backend, database)
- Set up project documentation

**Claude's contribution:**
- Analyzed the full task specification
- Proposed React + Node.js/Express + PostgreSQL as the stack
- Designed the full database schema (users, preferences, votes tables)
- Created `CLAUDE.md` with architecture documentation
- Created `AI_INTERACTIONS.md` (this file) for the required interaction log
- Outlined the step-by-step build plan

**My decisions:**
- Confirmed React, Node.js/Express, PostgreSQL as the stack
- Agreed to proceed step by step

---

### Session 1 — Step 1 & 2: Monorepo Scaffold + Server Setup (2026-05-08)

**What I asked:**
- Initialize a monorepo with `client/` (React + Vite) and `server/` (Node.js + Express)
- Install server deps: express, cors, dotenv, pg, bcrypt, jsonwebtoken, nodemon
- Create a basic `server.js` with health endpoint and `.env` / `.env.example`

**Claude's contribution:**
- Scaffolded Vite React app in `client/` and initialized Node.js in `server/`
- Installed all dependencies
- Created `server.js` with Express, CORS, dotenv, and a `GET /health` endpoint
- Set `"type": "module"` for ES module imports
- Added `dev` and `start` scripts to `package.json`
- Created `.env` and `.env.example` with all required env var slots
- Created root `.gitignore`
- Diagnosed port 5000 conflict (macOS AirPlay), switched to port 3001
- Verified health endpoint returns `{"status":"ok","timestamp":"..."}` ✓

**My decisions:**
- Confirmed port 3001 for local backend dev

### Session 2 — Step 2: DB Connection + Migrations (2026-05-08)

**What I asked:**
- Create `server/db/index.js` with a `pg` Pool export
- Create `server/db/init.js` migration script for users, preferences, votes tables
- Add `"migrate"` script to `package.json`
- Run the migration against the live DB

**Claude's contribution:**
- Created `db/index.js` — Pool setup with SSL handling for production vs local
- Created `db/init.js` — `CREATE TABLE IF NOT EXISTS` for all 3 tables with correct FK constraints and types (TEXT[], SERIAL, REFERENCES with CASCADE)
- Added `migrate` script to `package.json`
- Detected PostgreSQL not installed locally, recommended Neon (free cloud Postgres)
- Ran migration successfully: `✓ Tables created (users, preferences, votes)`

**My decisions:**
- Chose Neon as the hosted PostgreSQL provider (free tier, no local install)

### Session 3 — Step 3: Auth Routes + JWT Middleware (2026-05-08)

**What I asked:**
- Create `server/middleware/auth.js` — verify JWT from Authorization header, attach payload to `req.user`
- Create `server/routes/auth.js` — POST /register (bcrypt hash, insert user, return token) and POST /login (compare hash, return token)
- Mount auth routes at `/api/auth` in `server.js`

**Claude's contribution:**
- Created `middleware/auth.js` — extracts Bearer token, verifies with `jwt.verify`, returns 401 on missing/invalid token
- Created `routes/auth.js` — register with bcrypt (10 rounds), duplicate email handled via Postgres error code `23505`, login with `bcrypt.compare`, password field stripped from response
- Both endpoints return `{ token, user }` — user object never includes the hashed password
- Updated `server.js` to mount the router at `/api/auth`
- Live smoke tests passed: register ✓, login ✓, duplicate email → 400 ✓

### Session 4 — Step 4: Onboarding API + React Frontend Setup (2026-05-08)

**What I asked:**
- Create `server/routes/onboarding.js` (protected POST /, INSERT or UPDATE preferences)
- Mount at `/api/onboarding` in server.js
- Install react-router-dom, axios, lucide-react, Tailwind CSS v4
- Set up React routing in App.jsx (/login, /signup, /onboarding, /dashboard)
- Create Login.jsx, Signup.jsx, Onboarding.jsx, Dashboard.jsx (placeholder)

**Claude's contribution:**
- Created onboarding route with JWT auth guard; uses SELECT then INSERT/UPDATE pattern to avoid requiring a unique constraint migration
- Installed Tailwind CSS v4 via `@tailwindcss/vite` plugin (zero config file needed)
- Configured Vite dev proxy (`/api` → `localhost:3001`) so frontend never hard-codes the backend URL
- Created `src/api/client.js` — axios instance that automatically attaches JWT from localStorage
- Signup: registers, stores token, redirects to /onboarding
- Login: authenticates, stores token, redirects to /dashboard
- Onboarding: chip-based multi/single select UI for 3 preference categories, POSTs to /api/onboarding
- App.jsx: BrowserRouter with ProtectedRoute wrapper (redirects to /login if no token)
- Build verified: `✓ 1794 modules transformed` with no errors

**My decisions:**
- Dark theme (gray-950 background, amber-400 accent) chosen for crypto aesthetic

### Session 5 — Step 5: Dashboard API + Voting + Frontend (2026-05-08)

**What I asked:**
- Create `server/routes/votes.js` (POST, JWT-protected, insert into votes table)
- Create `server/routes/dashboard.js` (GET, JWT-protected, parallel data fetching)
- Build the full `Dashboard.jsx` with 4 cards, loading state, and per-item vote buttons

**Claude's contribution:**
- `votes.js`: validates section/item_id/vote fields, rejects non-up/down values, inserts to DB
- `dashboard.js`: parallel Promise.all of 4 data sources; each with error handling and fallback:
  - CoinGecko `/coins/markets` → real-time price + 24h change + coin image
  - CryptoPanic → real news if API key present, else dynamic mock news using user's coins
  - OpenRouter (`meta-llama/llama-3.1-8b-instruct:free`) → 2-sentence AI insight; 3 investor-type fallbacks if key missing
  - Reddit `/r/cryptocurrencymemes/top.json` → random image post; falls back to static array
- Dashboard UI: dark theme, 4-card 2-column grid, animated spinner, refresh button, logout
- VoteButtons: optimistic state update (immediate highlight), reverts on API error
- News card has per-article voting; Prices/AI/Meme have per-section voting
- Live API test confirmed: BTC $80,037 / ETH $2,291 / SOL $89 fetched from CoinGecko ✓

### Session 6 — Deployment: GitHub + Vercel + Render (2026-05-08)

**What I asked:**
- Push code to GitHub, deploy frontend to Vercel and backend to Render

**Claude's contribution:**
- Caught a missing production fix before push: axios `baseURL` was hardcoded to `/api` (works via Vite proxy locally, breaks on Vercel). Fixed to use `VITE_API_URL` env var with `/api` fallback
- Fixed SSL config in `db/index.js` — was tied to `NODE_ENV=production` but Render didn't have that set; changed to detect localhost vs remote from the connection string itself
- Added `client/vercel.json` with SPA rewrite rule so React Router routes (`/login`, `/signup`, etc.) don't 404 on Vercel
- Diagnosed `VITE_API_URL` not being baked into the Vercel build (env vars must be set before build runs, then requires a manual redeploy)
- Verified backend health and register endpoints directly against Render before frontend was fixed

**Fixes pushed:** 3 commits after initial push
**Final result:** App live at https://crypto-advisor-seven.vercel.app ✓

### Session 7 — Profile Page, Dashboard Redesign, Forgot Password (2026-05-08)

**What I asked:**
- Fix dashboard not stretching full width
- Add Edit Profile page (avatar color, name, preferences)
- Add forgot/reset password with email support

**Claude's contribution:**
- Fixed width constraint: changed `max-w-6xl` → `max-w-[1600px]` across dashboard
- Full dashboard redesign: 3-col layout, per-card colored accent bars, compact vote pills, sticky header with blur, animated loading dots, horizontal meme card
- `GET/PUT /api/profile` routes — fetch and update name + preferences
- Profile page: initials avatar with 6-color picker, name editing, preference chips, save with confirmation
- Avatar in dashboard header links to `/profile`
- Forgot password flow: token generated with `crypto.randomBytes`, stored in `password_reset_tokens` table (1h expiry, single-use)
- Demo mode: reset URL shown on screen when no email key set
- Email mode: Resend API integration — auto-activates when `RESEND_API_KEY` is present, no code changes needed
- `/forgot-password` and `/reset-password/:token` pages
- Email confirmed delivered to amitoved12@gmail.com ✓

### Session 8 — Polish, Bug Fixes & UI Upgrades (2026-05-08)

**What I asked:**
- Fix coin prices showing "–" on the live dashboard
- Add 7-day sparkline mini-charts to each coin row
- Rearrange dashboard from 3-col to 2×2 equal grid
- Add "Next insight" and "Next meme" buttons (later removed)
- Add OpenRouter attribution badge to AI insight card
- Replace avatar color picker with funny emoji avatars

**Claude's contribution:**
- Diagnosed CoinGecko rate limiting on Render's shared IPs as the root cause of missing prices
- Added 90-second in-memory price cache to prevent repeated API calls
- Added `/simple/price` fallback endpoint + hardcoded coin image map so coin logos always show
- Added `&sparkline=true` to CoinGecko request — returns 7 days of hourly data; downsampled to ~42 points per coin
- Built a pure SVG `Sparkline` component with area fill gradient (green/red based on 24h change), no external library
- Refactored dashboard layout to `grid-cols-2` with Prices/News top row and AI/Meme bottom row
- Added `GET /api/dashboard/insight` and `/meme` endpoints for dynamic refresh buttons
- Removed the refresh buttons after diagnosing a route 404 bug with Express v5 that was hard to reproduce locally — decided to keep scope aligned with task requirements
- Added `source: 'openrouter' | 'fallback'` field to AI insight response; frontend shows `⚡ OpenRouter AI` or `📋 Curated tip` badge
- Replaced avatar color picker with 12 crypto-themed emoji avatars (🚀 🦁 🐂 🐻 🐳 🦊 🤖 🐸 💎 🦄 🤠 👽); each has a label shown on hover
- Updated dashboard header to display the selected emoji instead of initials
- Expanded AI fallback from 1 static tip to 3 rotating tips per investor type

**Problems hit:**
- `GET /api/dashboard/meme` returned 404 while `/insight` returned 401 — same router, same middleware, could not reproduce consistently in isolation; suspected Express v5 route matching edge case or stale server process during testing
- Solution: removed both endpoints rather than debug further; feature was outside task scope

**My decisions:**
- Removed "Next insight / Next meme" buttons — the task spec says content refreshes on dashboard load, not on demand
- Kept OpenRouter attribution badge since it improves transparency

### Session 9 — Full UI/UX Overhaul + Dashboard Layout + Profile Password (2026-05-08)

**What I asked:**
- Fix global overscroll bug (page bouncing past edges)
- Redesign Login, Signup, and Onboarding pages with a premium feel
- Add an avatar selection step to Onboarding
- Upgrade typography and overall visual polish
- Fix Dashboard to a fixed-screen layout with independently scrollable card content
- Add a price sort dropdown to the Prices card
- Add vote button micro-animations
- Remove duplicate Save Changes button from Profile page
- Add Change Password section to Profile page with a backend route

**Claude's contribution:**
- Fixed overscroll: added `overflow-x: hidden` to `html, body` in `index.css`
- Redesigned Login/Signup with centered logo, glow background blur, card layout with rounded-2xl inputs
- Redesigned Onboarding with numbered step indicator, multi-step flow, and a new avatar selection step (12 crypto-themed emoji with large preview)
- Avatar emoji saved to localStorage on onboarding submit; displayed in dashboard header
- Dashboard layout: `h-screen flex flex-col overflow-hidden` root, `flex-1 min-h-0` chain to fill viewport exactly; `lg:grid-cols-2 lg:grid-rows-2` for equal 2×2 grid
- Card component: inner content uses `flex-1 min-h-0 overflow-y-auto scrollbar-hide` for independent scroll
- `ChevronsUpDown` sort dropdown in Prices card header — sorts by default, price desc/asc, or 24h change
- Vote button micro-animation: local `popping` state triggers `vote-pop` CSS keyframe (bounce scale) for 380ms; `active:scale-90` for instant press feedback
- Removed bottom duplicate Save button from Profile — header button is the single save action
- Added Change Password section: `currentPassword` / `newPassword` inputs, client-side validation (min 6 chars), `PUT /api/profile/password` route
- Backend password route: `bcrypt.compare` to verify current password, `bcrypt.hash` for new password, updates DB

**My decisions:**
- Kept emoji avatar system in localStorage only (DB persistence deferred to future session)

---

### Session 10 — Skeleton Loaders & Toast Notifications (2026-05-08)

**What I asked:**
- Install `react-hot-toast` and set up a global `<Toaster />` in App.jsx
- Replace the basic loading spinner in Dashboard with shape-accurate skeleton loaders for all 4 cards
- Add toast notifications to Profile (save, password change) and Signup (account created)

**Claude's contribution:**
- Installed `react-hot-toast` via npm
- Added `<Toaster />` to App.jsx with dark gray background, amber success icon, red error icon, and rounded-xl style matching the app's design language
- Replaced `<Spinner />` early return in Dashboard with inline skeleton components rendered inside the same 2×2 grid — no layout shift between loading and loaded state
- `PricesSkeleton`: 5 rows with circular avatar placeholder, two text lines, sparkline bar, price/badge placeholders
- `NewsSkeleton`: 5 rows with number placeholder, two title lines, source badge, and vote area
- `AIInsightSkeleton`: quote mark block, 4 text lines, attribution badge row
- `MemeSkeleton`: full-height image block, two caption lines, vote area
- All skeleton elements use `animate-pulse bg-gray-800 rounded` via a shared `SkeletonPulse` helper
- Profile: `toast.success('Profile saved!')` + `toast.error(...)` on save; `toast.success('Password updated!')` + `toast.error(...)` on password change
- Signup: `toast.success('Account created! Welcome aboard.')` before navigating to onboarding

---

### Session 2 — Premium UI & Advanced Personalization (2026-05-09)

**What I asked:**
- Add 4 personalized widgets: Fear & Greed Index (animated gauge), $1,000 ROI Calculator, Trending NFTs, and Whale Alerts
- Transition the dashboard from a fixed 2×2 CSS grid to a responsive CSS Masonry layout
- Debug and fix conditional widget rendering so all 8 widgets actually show based on `contentTypes` preferences
- Add skeleton loaders for all 8 widgets that match the masonry layout (no layout shift)
- Add `react-hot-toast` notifications for profile save, password change, and signup
- Implement drag-and-drop widget ordering: users drag selected content types in Profile to define the dashboard render order, which is then respected by Dashboard

**Claude's contribution:**
- Added `FearGreedCard` with a pure-SVG animated semicircle gauge (arc stroke-dashoffset, rotating needle) driven by the Alternative.me free API
- Added `ROICard` fetching CoinGecko historical price 365 days ago vs today to compute actual 1-year ROI for each tracked coin
- Added `NFTCard` pulling trending NFT collections from CoinGecko `/nfts/list` + `/nfts/{id}` with 24h floor price change
- Added `WhaleAlertCard` with simulated large on-chain transfer alerts (static data with realistic random timestamps)
- Refactored Dashboard grid from `lg:grid-cols-2` to CSS `columns-1 md:columns-2 xl:columns-3` for masonry; added `break-inside-avoid mb-5` to all cards
- Replaced hardcoded `wants()` conditional checks with a dynamic `renderWidget(type)` switch that maps over `data.contentTypes` (or a default ALL_TYPES order if empty) — ensuring render order exactly matches user preference
- Added 6 shape-accurate skeleton cards (two extra for the new widgets) inline in the masonry container during load
- Installed `react-hot-toast` and wired up `toast.success/error` calls in Profile and Signup
- Installed `@hello-pangea/dnd` and rebuilt the Content Preferences section in Profile:
  - Selected types render as a `DragDropContext > Droppable > Draggable` list with a `GripVertical` handle and position badge (`#1`, `#2`, …) and an ×-remove button
  - Unselected types render as clickable chips below a divider — clicking appends them to the ordered list
  - `handleSave` sends `content_types` in the exact dragged order to the backend; Dashboard consumes this order directly

**Problems hit and fixed:**
- Deployment cache on Vercel served a stale build after the first masonry push — forced a redeploy via the Vercel dashboard
- `@hello-pangea/dnd` requires `key` to equal `draggableId` on the `<Draggable>` wrapper; mismatched keys caused console warnings during reorder — fixed by using the content type string as both

**My decisions:**
- Kept Whale Alerts as simulated data (no real Whale Alert API key) — fits the portfolio/demo purpose of the task
- Left NFT data on a best-effort basis (CoinGecko free tier may rate-limit); card falls back gracefully to no data

---

### Session 3 — Interactive ROI Calculator & Gemini Collaboration (2026-05-09)

**What I asked:**
- Refactor the static ROI list into a fully interactive calculator.
- I decided to switch from Claude Code to **Google Gemini** to collaborate on this specific feature manually, gaining more control over the React component structure.

**Gemini's contribution:**
- Analyzed the existing `ROICard` and `Dashboard.jsx` structure.
- Guided me in rewriting the `ROICard` component using `useState` for active coin selection.
- Designed a premium UI with a custom `<select>` dropdown, large hero-style numbers, and dynamic green/red profit badges.
- Ensured the existing thumbs up/down voting mechanism remained fully functional for the actively selected coin.

**My decisions:**
- Implemented the custom interactive component instead of relying entirely on Claude's auto-generated static list, improving the overall UX.
- Updated the documentation to reflect this multi-AI development workflow.

### Session 4 — Backend Resilience & API Rate Limit Fixes (2026-05-10)

**What I asked:**
- Fix the issue where the dashboard occasionally displays a blank screen or missing prices ("–") due to CoinGecko's aggressive rate limiting (returning 429 errors on both primary and fallback endpoints).

**Claude's / Gemini's contribution:**
- Diagnosed the root cause of the API failures and applied three critical backend fixes in `server/routes/dashboard.js`:
  1. **Stale Cache Fallback:** Modified the error handling logic to return the `_priceCache` (even if expired) when all CoinGecko API calls fail. This ensures users always see the last known prices instead of broken UI components.
  2. **Authenticated Fallback:** Added the `x-cg-demo-api-key` header to the `/simple/price` fallback request, which was previously unauthenticated and hitting stricter anonymous rate limits.
  3. **Optimized TTL:** Increased the `PRICE_CACHE_TTL` from 90 seconds to 5 minutes to significantly reduce request frequency and conserve the rate limit budget.

**My decisions:**
- Prioritized "Graceful Degradation" and UI stability over real-time data freshness, ensuring a flawless presentation for the interview demonstration.

### Session 5 — Network Resilience & UX Fallbacks (2026-05-10)

**What I asked:**
- Diagnose and fix extreme dashboard loading delays (sometimes taking 20+ minutes or hanging indefinitely) caused by CoinGecko API rate limits.
- Ensure the UI gracefully handles these massive delays without leaving the user staring at a silent loading screen.

**AI's contribution & My decisions:**
- Diagnosed the root cause: Node.js native `fetch` lacks a built-in timeout. A single stalled CoinGecko request would hang the entire Promise pool.
- **Backend Fix 1:** Implemented a `fetchWithTimeout()` helper using `AbortController` (8-second timeout) across all 7 external API calls.
- **Backend Fix 2:** Introduced a `STATIC_PRICE_FALLBACK` for absolute "cold start" scenarios where the API is unreachable, ensuring the dashboard always renders.
- **Frontend Fix 1:** Added a dynamic "Slow connection" banner that appears if the dashboard takes longer than 8 seconds to load, vastly improving UX.
- **Frontend Fix 2:** Added an "Approximate values" badge to the Prices card when rendering static fallback data to maintain data integrity and transparency.

### Session 6 — Premium Dashboard OS Overhaul (2026-05-11)

**What I asked:**
- Replace the masonry layout with a fixed "one-screen" layout (no page scroll) using a 12-column CSS Grid
- Implement an animated mesh gradient background with drifting glow blobs
- Apply glassmorphism to all cards (backdrop-blur, semi-transparent dark glass, colored border + glow per widget)
- Load Inter font globally for premium typography
- Add per-widget sizing (S/M/L) saved to the DB and consumed by the grid
- Add an "Edit sizes" mode to Profile with per-widget S/M/L toggle buttons
- Redesign skeleton loaders, slow-load indicator, and stale price notice to match the new design system

**Claude's contribution:**

**Backend (3 files):**
- `server/db/init.js` — added `ALTER TABLE preferences ADD COLUMN IF NOT EXISTS widget_sizes JSONB DEFAULT '{}'::jsonb` (non-destructive, safe to re-run)
- `server/routes/profile.js` — `GET` now selects `widget_sizes`; `PUT` accepts and persists it
- `server/routes/dashboard.js` — selects `widget_sizes` from preferences and returns it as `widgetSizes` in the response payload

**Frontend — Dashboard.jsx (complete rewrite):**
- `MeshBackground` component: fixed-position, 3 CSS `@keyframes` blob divs (violet/amber/sky) animating on 18–30s loops with `blur-[130px]`; subtle grid dot overlay at 1.8% opacity
- `WIDGET_META` constant: maps each of the 8 widget types to an accent hex color, glow rgba, icon, and label — single source of truth for the entire visual system
- `GlassCard` component replaces the old `Card`: inline styles for `rgba(6,6,16,0.76)` background, `backdrop-blur(28px)`, colored `border` and `box-shadow` glow; 2px gradient accent bar; internal `overflow-y-auto` scrollable body
- `GlassSkeleton` component: 8 glass-style pulse skeletons matching default widget positions (6+6 / 3+3+3+3 / 6+6)
- Grid: `h-dvh overflow-hidden flex flex-col` root; `grid-template-rows: repeat(3, 1fr)` + `grid-auto-flow: dense` gives a pixel-perfect no-scroll layout
- `getColSpan()` maps S→3, M→6, L→12 columns, falling back to per-widget defaults
- Slow-load indicator moved inline to the header as a compact spinner (no layout-disrupting banner)
- `APPROX` badge in the Prices card header (replaces the old disruptive amber banner)
- All 8 widget components updated: use `GlassCard`, receive `widgetSizes`, pass `colSpan` down; colors/borders match the glass system

**Frontend — Profile.jsx:**
- `widgetSizes` state loaded from `GET /api/profile` and sent on save
- "Edit sizes" toggle button in the Dashboard Layout section header
- When active: each draggable widget row reveals S/M/L buttons styled with the widget's own accent color; active size highlighted, inactive dimmed
- `DEFAULT_SIZE` and `WIDGET_ACCENT` constants keep sizing logic and colors co-located
- Hint text warns users that oversized widgets may push others off-screen

**`client/index.html`:**
- Added Google Fonts `<link>` for Inter (weights 400–900)
- Added `<style>` block: `* { font-family: 'Inter', system-ui, sans-serif }`, `body { background: #04040a }`, global scrollbar hide

**Build result:** `✓ 1809 modules transformed`, 442 kB JS / 40 kB CSS, no errors

**My decisions:**
- Chose `grid-template-rows: repeat(3, 1fr)` with `overflow-hidden` as the simplest one-screen approach — widgets that overflow are clipped (documented as a known limitation)
- Kept row span always at 1 (height = 1/3 viewport); users control only column width via S/M/L — avoids complex row-span collision logic
- Kept `@hello-pangea/dnd` for ordering; size toggles are separate buttons, not draggable resize handles

---

## Bonus: Feedback Loop & Model Training Suggestion

### How Votes Can Power Future Model Improvements

The dashboard stores thumbs up/down votes per user per content section (news article, price alert, AI insight, meme). This creates a naturally labeled dataset that can be used for model improvement.

#### Data Structure
Each vote record contains:
- `user_id` — links to the user's preferences (crypto assets, investor type, content type)
- `section` — which dashboard section was voted on
- `item_id` — the specific content item
- `vote` — `up` or `down`

#### Training Pipeline (Suggested)

1. **Feature engineering:** For each vote, build a feature vector combining:
   - User preferences (encoded as embeddings or one-hot)
   - Content metadata (coin mentioned, news category, sentiment score)
   - Time of day / day of week

2. **Model choice:** Start with a simple collaborative filtering or logistic regression model. Graduate to a neural ranking model as data grows.

3. **Training goal:** Predict `P(vote = up | user, content_item)` — i.e., how likely is this user to like this content?

4. **Re-ranking:** Use predicted scores to re-order content shown in each section, surfacing items the user is more likely to upvote.

5. **Retraining schedule:** Run a weekly batch retraining job (e.g., via a cron job on Render) as new votes accumulate. Use the previous model as a baseline and only deploy if the new model improves on a held-out validation set.

6. **Cold start problem:** For new users (no votes yet), fall back to content ranked by global popularity (most upvoted across all users with similar preferences from onboarding).

#### Why This Works
The onboarding quiz provides a strong prior signal before any votes exist. As the user interacts, the vote history gradually dominates the signal. This mirrors how production recommendation systems (Netflix, Spotify) bootstrap from explicit preferences before shifting to behavioral signals.
