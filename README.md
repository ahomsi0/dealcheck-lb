# DealCheck LB

DealCheck LB is a buyer-protection tool for Lebanon's second-hand marketplace. Users paste a listing URL or listing text, then get a structured report with risk scoring, seller trust signals, red flags, scam-pattern warnings, negotiation guidance, and a buyer checklist.

The app is designed for Lebanese marketplace workflows across OLX Lebanon, Dubizzle, Facebook Marketplace, WhatsApp seller messages, and informal listings.

## Features

- URL auto-fill for public OLX/Dubizzle-style listing pages
- Full OLX description extraction from embedded page state when available
- Seller trust detection for OLX listings, including verified seller and individual/agency status
- Risk score and confidence score
- Category-specific red flags for cars, motorcycles, phones, laptops, office chairs, electronics, appliances, and other items
- Scam-pattern detection for pressure tactics, advance-payment language, inspection avoidance, and suspiciously low prices
- Manual comparable listing input with median, low/high, and asking-price comparison
- Suggested opening offer, walk-away price, and negotiation script
- Shareable report summary and print/save-as-PDF action
- Saved analysis records through a Postgres-ready storage layer

## Tech Stack

- Framework: Next.js 16 App Router
- Language: TypeScript
- UI: React 19, Tailwind CSS, shadcn-style local components, Base UI primitives
- Icons: Lucide React
- Database: Neon Postgres via `@neondatabase/serverless`
- Deployment target: Vercel
- Local fallback storage: JSONL file under `data/` when `DATABASE_URL` is not configured

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the local URL printed by Next.js, usually:

```text
http://localhost:3000
```

Useful commands:

```bash
npm run lint
npm run build
```

## Environment Variables

Create `.env.local` from the example file:

```bash
cp .env.example .env.local
```

Set your Neon connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
```

Without `DATABASE_URL`, the app still works locally and saves listing records to `data/listings.jsonl`. The `data/` directory is ignored by git.

## Database

The production database is Neon Postgres. The schema is available in:

```text
sql/neon-schema.sql
```

The app also creates the `listings` table automatically at runtime if it does not exist.

Saved records include:

- Original listing input
- Listing URL when available
- Category, price, currency, and location
- Seller verification/type signals
- Listing text and seller notes
- Comparable listing text
- Full analysis JSON

## Deployment

Recommended deployment stack:

- Vercel for hosting
- Neon for Postgres
- GitHub for source control

Deployment steps:

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Add `DATABASE_URL` in Vercel project settings.
4. Deploy.

## Data Notes

DealCheck does not use unauthorized marketplace scraping for market-wide pricing. Median comparisons are based on user-provided comparable listings and the app's own saved first-party analysis records over time.

OLX/Dubizzle URL auto-fill is best-effort extraction from publicly returned page data. Facebook Marketplace and Instagram are treated as manual-input sources because they commonly require login and block automated access.
