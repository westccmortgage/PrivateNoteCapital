# Private Note Capital — one combined platform

**One repository · one app · one `main` branch · one Netlify site · one domain
(`privatenotecapital.com`).** Operated by West Coast Capital Mortgage Inc. (NMLS 2817729).

Two products, one codebase and shell:

1. **Foreclosure & Auction Intelligence** (primary) — search California & Florida foreclosure
   and auction opportunities; track auctions; save properties; request acquisition financing.
2. **Private Debt** (`/private-debt`) — a capital-partner program for conservatively
   underwritten, real-estate-secured California trust deeds. *Not an offer of securities.*

## Stack

Next.js **15.5.22** (App Router, TS) · Tailwind · Supabase (Postgres + Auth, RLS) ·
Netlify (`@netlify/plugin-nextjs` v5). Node 20. Production `npm audit`: 0 vulnerabilities.

## Routes

`/` · `/search` · `/property/[id]` · `/calendar` · `/watchlist` · `/financing` · `/saved`
· `/about-data` · `/private-debt` · `/private-debt/investors` · `/private-debt/faq`
· `/private-debt/review` · `/company` · `/contact` · `/privacy` · `/terms` · `/login`
· `/admin/import`. API: `/api/search`, `/api/financing`, `/api/watchlist`, `/api/saved`,
`/api/private-debt`, `/api/contact`, `/api/admin/import`.

## One GRCRM integration

Every inquiry type (financing, property, watchlist, contact, private-debt investor,
consultation) flows through **one** path — `lib/crm.ts` + `lib/lead.ts` → the verified GRCRM
lead-inbound webhook. Deterministic `event_id`, delivery-state classification, 8 s timeout,
PII-safe logs, server-only secrets. Contract detail: `docs/GRCRM-CONTRACT-MAPPING.md`.

## Develop

```bash
npm install
cp .env.example .env.local     # optional — app runs (empty states) without keys
npm run dev                    # http://localhost:3000
npm run typecheck && npm run lint && npm test && npm run build
npm audit --omit=dev           # 0 production vulnerabilities
```

## Database

Run `supabase/migrations/0001…`, `0002…`, `0003…` (see `docs/STAGING-SUPABASE-VERIFICATION.md`).
Private-debt inquiries flow through the centralized lead delivery (no separate tables).

## Documentation

- `docs/foreclosure-platform-architecture.md`, `docs/data-import-guide.md`
- `docs/GRCRM-CONTRACT-MAPPING.md`, `docs/GRCRM-DELIVERY-FAILURE-MODEL.md`
- `docs/NEXTJS-SECURITY-UPGRADE.md`, `docs/STAGING-ENVIRONMENT-MATRIX.md`
- `docs/STAGING-SUPABASE-VERIFICATION.md`, `docs/deployment.md`, `docs/rollback.md`
- `docs/CONSOLIDATION-REPORT.md` — this consolidation
- Historical audit records: `docs/PRIVATE-NOTE-CAPITAL-PREDEPLOYMENT-REPORT.md`,
  `docs/SECURITY-REMEDIATION-REPORT.md`
