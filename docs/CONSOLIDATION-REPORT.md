# Consolidation report — one application

Owner-authorized merge of the foreclosure platform and the private-debt investor platform
into a single application on `main`. **One repo · one app · one branch · one Netlify site ·
one domain (`privatenotecapital.com`).** The two-site / subdomain plan is retired.

## What was combined

- **Foreclosure (primary, preserved):** `/`, `/search`, `/property/[id]`, `/calendar`,
  `/watchlist`, `/saved`, `/financing`, `/about-data`, `/admin/import` — unchanged, on the
  secure Next 15.5.22 foundation.
- **Private Debt (brought in from `debt-platform`, adapted to the shared design system):**
  `/private-debt` (landing + yield illustrator), `/private-debt/investors` (InvestorIntake),
  `/private-debt/faq`, `/private-debt/review` (consultation), plus `/company` (About) and a
  working contact form on `/contact`.

Reused debt functionality: `lib/trust-deed.ts` (yield math + approved disclosures),
InvestorIntake fields, YieldIllustrator, book-review/consultation, company + FAQ + compliance
copy, suitability/risk/not-an-offer disclosures. **Not** brought over: the second visual
system, the separate `/api/investor-lead` + `/api/book-review` routes, the old
`grcrm-client.ts`, stale CADeed README, domain assumptions, duplicate headers/footers/CRM
clients.

## One of everything

- **Shell:** one `SiteHeader` (nav: Search · Calendar · Financing · Private Debt · About ·
  Contact; Watchlist/Saved in the mobile drawer) + one `SiteFooter` (internal `/private-debt`
  link; the external subdomain link is gone).
- **GRCRM:** one integration (`lib/crm.ts` + `lib/lead.ts`). All inquiry types —
  financing, property, watchlist, contact, investor, consultation — post to `/api/*` and flow
  through `recordInterest → sendToGRCRM`. Each payload carries `source`, `request_type`,
  `external_event_id`, `submitted_at`, contact info, consent, property ref (when applicable),
  private-debt metadata (when applicable), and `source_url`. Deterministic event id,
  delivery-state classification, timeout, PII-safe logs, server-only secrets — all preserved.
- **Env:** one public module (`lib/env.ts`) + one server module (`lib/env.server.ts`).
  Removed the obsolete `NEXT_PUBLIC_DEBT_PLATFORM_URL`.
- **Database:** one Supabase schema. Private-debt inquiries flow through the centralized lead
  delivery — no new tables. Migrations `0001`–`0003` unchanged (not applied here).
- **Domain:** one canonical `privatenotecapital.com`; Private Debt is the internal
  `/private-debt` route. Sitemap/robots/OG updated; no subdomain references in code.

## Security preserved (no regression)

Next 15.5.22 · production `npm audit` **0** · server-only secret isolation (bundle scan:
only the 3 `NEXT_PUBLIC_*` vars) · HSTS · honeypot on all public forms (financing, watchlist,
investor, contact) · rate limiting · CSV formula neutralization + filename sanitization ·
server-side admin authorization · RLS · unpublished-property controls · GRCRM signing +
idempotency + safe timeouts.

## Gate

`npm ci` 0 · `npm run typecheck` 0 · `npm run lint` 0 · `npm test` **55/55** ·
`npm run build` 0 (all routes) · `npm audit --omit=dev` **0** · client-bundle secret scan
clean. Runtime smoke: all routes 200; investor consent 400; honeypot dropped; contact
validation 400; no horizontal overflow at 390/768/1440.

## Removed / obsolete

Deleted the two-site operational docs (`debt-subdomain-migration.md`,
`DOMAIN-OWNER-DECISION.md`); rewrote `deployment.md` + `NETLIFY-RELEASE-RUNBOOK.md` to a
single site; refreshed the README. Historical audit/remediation reports remain as records.
Rollback branches (`rollback/pre-foreclosure`, `debt-platform`) are untouched in history.

**Status: COMBINED AND PUSHED TO MAIN.**
