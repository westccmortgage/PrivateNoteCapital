# Foreclosure & Auction Intelligence — architecture

**Branch:** `main` · **Domain:** `privatenotecapital.com`
**Stack:** Next.js 14 (App Router, TS) · Tailwind · Supabase (Postgres + Auth) · Netlify (`@netlify/plugin-nextjs`)

## Overview

A public search + lead-generation platform for California & Florida foreclosure/auction
opportunities. Search is the product; the financing form is secondary. Data is shown only
from real, approved imports — the app never fabricates listings and hides any section that
has no records.

## Routes

| Route | Type | Notes |
|---|---|---|
| `/` | Server | Hero + search + DB-driven opportunity sections (hidden when empty) + financing paths |
| `/search` | Server | Filters (mobile drawer), shareable query params, pagination, empty/loading/error states |
| `/property/[id]` | Server | All available fields + required source / last-updated / disclaimer + actions |
| `/calendar` | Server | Upcoming auctions grouped by date |
| `/watchlist` | Server + client form | Consent-gated weekly watchlist subscription |
| `/financing` | Server + client form | Short intake, property-connected via query params |
| `/saved` | Server (auth) | Signed-in saved list + tracking + remove/review |
| `/about-data`, `/privacy`, `/terms`, `/contact` | Server | Disclosure + legal + contact |
| `/login` | Server + client | Supabase email/password auth |
| `/admin/import` | Server (admin) | CSV import wizard + history |
| `/api/search` | Route (GET) | JSON search, RLS-scoped to published rows |
| `/api/financing`, `/api/watchlist` | Route (POST) | Validated, rate-limited, → DB + GRCRM |
| `/api/saved` | Route (POST/DELETE) | Auth-gated, RLS owner-only |
| `/api/admin/import` | Route (POST) | Admin-gated validate/commit |

## Data model

See `supabase/migrations/0001_foreclosure_schema.sql` and `0002_rls_policies.sql`:
`foreclosure_properties`, `auction_events`, `saved_properties`, `search_alerts`,
`property_interests`, `import_jobs`, `admin_users`. Property data is kept entirely separate
from lead/contact data (no shared "leads" table). The upsert key is
`(source_name, external_id)`.

## Security model

- **RLS everywhere.** Public/anon read only `record_status = 'published'` rows. All
  property/auction/import writes are **service-role only** (server-side). Users can read/write
  only their own `saved_properties` / `search_alerts`. `property_interests` are written
  server-side after validation.
- **Service-role key is server-only** (`SUPABASE_SERVICE_ROLE`, no `NEXT_PUBLIC_` prefix),
  used in `lib/supabase/server.ts` (`getAdminSupabase`) and never imported by client code.
- **Admin routes** are gated by `isAdmin()` (membership in `admin_users`, checked with the
  service role) in `app/admin/layout.tsx` and re-checked in `/api/admin/import`.
- **Validation** is server-side for every POST (`lib/validation.ts`). **Rate limiting** on
  public submission endpoints (`lib/rate-limit.ts`). **CSV** is size-capped (5 MB) and
  parsed with a strict quote-aware parser; only mapped columns are read.
- **No secrets logged.** GRCRM/DB failures are captured, never thrown, so leads aren't lost;
  passwords/tokens are never logged.

### Production hardening notes
- `lib/rate-limit.ts` is in-memory (per serverless instance). For strict multi-instance
  limits, back it with Upstash/Redis and key by IP + route.
- Add a bot-protection layer (Turnstile/hCaptcha token verified server-side) on public POSTs
  before high-volume launch; the routes are structured to drop a check in at the top.
- Set `admin_users` rows via SQL/service role only.

## Traffic entry & attribution

Inbound links from `suncoastcapitalmortgage.com`, `californiamtg.com`,
`browardcountymortgage.com` can deep-link with params, e.g.
`/search?state=FL&county=Broward&financing=auction`. UTM params + referrer are captured
client-side (`lib/attribution.ts`) and forwarded to GRCRM with every lead.

## Graceful degradation

With no env configured the app still builds and renders: search/opportunity/calendar show
clean empty states, auth/admin show "not enabled", and lead POSTs validate + return success
while logging locally (email/CRM are best-effort). This lets the site deploy before the
backend is fully wired.
