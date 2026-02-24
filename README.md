# BNPLScore — Agricultural BNPL Risk Scoring

A modern, full-stack Next.js application for transparent, rule-based credit scoring of agricultural BNPL financing. Rebuilt from a Python/FastAPI system into a Vercel-deployable web app with a dark fintech UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Charts | Recharts |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod v4 |
| Theme | next-themes (dark/light) |
| Deployment | Vercel |

---

## Features

- **8-Factor Risk Engine** — region, farm type, experience, prior defaults, liquidity, farm size, device trust, identity consistency
- **Sigmoid PD Mapping** — linear score mapped to late payment probability via sigmoid function
- **3-Step Scoring Wizard** — animated multi-step form with per-step Zod validation
- **Animated Risk Gauge** — SVG semicircle gauge with Framer Motion draw animation
- **Full Explainability** — ranked breakdown of all 8 risk contributors
- **Product Matching** — deterministic matcher across 6 BNPL products
- **Risk-Adjusted BNPL Terms** — credit limits and crop-cycle-aligned tenors
- **Analytics Dashboard** — pre-computed 1,000-profile synthetic dataset; PD histogram, scatter plot, product distribution, segment tables
- **Dark/Light Mode** — global theme toggle
- **REST API** — `/api/score`, `/api/recommend`, `/api/batch`

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout (ThemeProvider, Navbar, Footer)
│   ├── page.tsx                # Landing page
│   ├── score/page.tsx          # Multi-step scoring form
│   ├── result/page.tsx         # Score results
│   ├── dashboard/page.tsx      # Analytics dashboard
│   └── api/
│       ├── score/route.ts      # POST /api/score
│       ├── recommend/route.ts  # POST /api/recommend
│       └── batch/route.ts      # POST /api/batch
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Navbar, Footer
│   ├── landing/                # Hero, StatsBar, FeaturesGrid, HowItWorks, CTA
│   ├── score/                  # ScoreForm, StepIndicator, Step1-3
│   ├── result/                 # RiskGauge, DecisionBadge, ContributorsChart, ProductCard, BnplTerms
│   └── dashboard/              # KpiGrid, RiskHistogram, FarmScatter, ProductBar, SegmentTable
└── lib/
    ├── types.ts                # Shared TypeScript interfaces
    ├── scoring-engine.ts       # 8-factor risk scoring + sigmoid PD
    ├── product-matcher.ts      # Deterministic product matching
    ├── bnpl-policy.ts          # Credit limit + tenor calculation
    └── synthetic-data.ts       # 1,000 pre-computed profiles for dashboard
```

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

---

## API Reference

### `POST /api/score`

Score a single applicant profile.

**Request body:**
```json
{
  "user_id": "FARM_001",
  "region": "North",
  "farm_type": "smallholder",
  "crop_type": "maize",
  "farm_size_ha": 3.5,
  "years_experience": 8,
  "monthly_income_est": 42000,
  "recent_cash_inflows": 115000,
  "avg_order_value": 18500,
  "device_trust_score": 76.3,
  "identity_consistency": 83.2,
  "prior_defaults": 0,
  "liquidity_ratio": 2.74
}
```

**Response:** `ScoreResult` with `linear_risk_score`, `late_payment_prob`, `risk_tier`, `decision`, and `explanation`.

---

### `POST /api/recommend`

Full recommendation: score + product match + BNPL terms.

**Request body:** same as `/api/score`

**Response:** `FullRecommendation` with `score`, `product`, and `bnpl_terms`.

---

### `POST /api/batch`

Score an array of applicants and return batch summary stats.

**Request body:** `ApplicantProfile[]`

**Response:** `BatchSummary` with totals, rates, mean PD, and individual results.

---

## Risk Scoring Model

### 8-Factor Weighted Score

| Factor | Weight | Description |
|---|---|---|
| Prior Defaults | 0.20 | Penalty: 0.15 per default, capped at 0.75 |
| Farm Type | 0.18 | smallholder=0.35, cooperative=0.20, commercial=0.10 |
| Experience | 0.15 | ≤2yr=0.40, ≤10yr=0.25, ≤20yr=0.15, >20yr=0.10 |
| Region | 0.12 | West=0.30, South=0.25, Central=0.20, North/East=0.15 |
| Device Trust | 0.10 | (100 − score) / 100 |
| Liquidity | 0.10 | 1 − min(ratio/3, 1) |
| Identity | 0.07 | (100 − score) / 100 |
| Farm Size | 0.08 | U-shaped: <1ha=0.30, 1–10=0.10, 10–100=0.05, >100=0.15 |

### PD Mapping

```
PD = 1 / (1 + exp(-15 × (score − 0.35)))
```

### Risk Tiers

| PD | Tier | Decision |
|---|---|---|
| < 15% | Low | Auto Approve |
| 15–35% | Medium | Manual Review |
| 35–50% | High | Manual Review |
| ≥ 50% | Decline | Auto Decline |

---

## BNPL Products

| Product | Base Limit | Base Tenor | Target |
|---|---|---|---|
| Seeds BNPL | 20,000 | 4 months | Maize/rice smallholders |
| Fertilizer BNPL | 35,000 | 3 months | Vegetables/horticulture |
| Input Bundle | 50,000 | 6 months | Mixed/cooperative farms |
| Premium BNPL | 75,000 | 6 months | Established customers |
| Equipment Lease | 150,000 | 12 months | Commercial farms |
| Cash Advance | 10,000 | 2 months | Small-order, high-trust |

Credit limits are scaled by `risk_multiplier × income_multiplier × tenure_multiplier`. Tenors are shortened by risk tier and capped by crop cycle (maize/rice ≤4mo, horticulture ≤3mo).

---

## Dashboard

The dashboard uses a pre-computed synthetic dataset of 1,000 farmer profiles generated with a seeded PRNG (fully reproducible, no runtime computation needed). Charts include:

- **PD Histogram** — distribution across 10 probability buckets, color-coded by risk tier
- **Farm Size vs PD Scatter** — 200-point sample colored by farm type
- **Product Distribution** — horizontal bar chart of top-recommended products
- **Segment Tables** — breakdowns by farm type, region, and risk tier

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `brand-indigo` | `#6366f1` | Primary actions, links, gauge low-risk |
| `brand-emerald` | `#10b981` | Success, approve, credit limit |
| `brand-amber` | `#f59e0b` | Warning, manual review |
| `brand-rose` | `#f43f5e` | Danger, decline |
| Background dark | `slate-950` | Page background |
| Background light | `white` | Page background |

---

## Deployment (Vercel)

```bash
vercel deploy
```

No environment variables required — all data is computed client-side/server-side from static logic.

---

## Key Metrics (Synthetic Dataset)

- **1,000** scored profiles
- **~67%** auto-approve rate (PD < 15%)
- **~99.9%** overall approval rate
- **~13%** mean late-payment probability
- **6** BNPL products matched deterministically
