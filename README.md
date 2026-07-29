# PrivateNoteCapital.com — Foreclosure & Auction Intelligence

Public search + lead-generation platform for California & Florida foreclosure and auction
opportunities. **Find the property. Track the auction. Analyze the opportunity. Arrange the
capital.**

> Operated by West Coast Capital Mortgage Inc. (NMLS 2817729). The private-debt investor
> application is preserved separately at **https://debt.privatenotecapital.com**
> (branch `debt-platform`).

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind CSS · Supabase (Postgres + Auth, RLS) ·
Netlify (`@netlify/plugin-nextjs`). Node 20.

## What it does

- **Search** CA/FL foreclosure & auction records (filters, mobile drawer, shareable URLs,
  pagination) — the primary product.
- **Property pages** show every available field plus required **source**, **last-updated**,
  and an availability disclaimer.
- **Save** properties & **track** auctions (account required), **weekly watchlist**
  (consent-gated), and **financing** requests connected to a property.
- **Admin CSV import** (`/admin/import`) with validation preview, duplicate detection,
  rejected-row download, and history. Approved sources only — **no scraping, no fabricated
  listings.**
- Leads persist to Supabase and forward to **GRCRM** (internal) via the existing approved
  webhook; the Supabase service-role key stays server-side.

## Develop

```bash
npm install
cp .env.example .env.local     # optional — app runs (with empty states) without keys
npm run dev                    # http://localhost:3000
npm run typecheck && npm run lint && npm test && npm run build
```

## Database

Run `supabase/migrations/0001_foreclosure_schema.sql` then `0002_rls_policies.sql`.
Tables: `foreclosure_properties`, `auction_events`, `saved_properties`, `search_alerts`,
`property_interests`, `import_jobs`, `admin_users`.

## Documentation

- `docs/foreclosure-platform-architecture.md` — routes, data model, security
- `docs/data-import-guide.md` — CSV import + sources
- `docs/propertyradar-integration.md` — restricted-source placeholders + blockers
- `docs/grcrm-integration.md` — CRM mapping + security
- `docs/deployment.md` — two-site Netlify + env + DNS
- `docs/rollback.md` — restore points and procedures
- `docs/current-private-note-capital-system.md` — pre-foreclosure audit
- `docs/debt-subdomain-migration.md` — debt subdomain runbook
