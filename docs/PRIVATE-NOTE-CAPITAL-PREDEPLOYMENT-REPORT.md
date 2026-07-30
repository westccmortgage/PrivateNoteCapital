# Private Note Capital — pre-deployment report

**Type:** independent verification + minimal corrections. **No deploy, no DNS, no production
Supabase/GRCRM, no migrations applied, preserved branches untouched.**
**Audit branch:** `grok/private-note-capital-predeployment-audit` (from `origin/main` `bc5b73f`).

---

## 1. Repository verification

- `pwd` `/workspace/privatenotecapital`; toplevel same; remote
  `westccmortgage/privatenotecapital`; working tree clean at audit start.
- No hard-stop conditions: repo correct, all preservation branches present, tree clean, main
  holds the foreclosure app, debt-platform holds the investor app.

## 2. Remote branch map (SHAs)

| Branch | SHA | Contents |
|---|---|---|
| `main` | `bc5b73f` | Foreclosure & Auction Intelligence platform |
| `debt-platform` | `9b5d5c2` | Preserved investor/debt app + subdomain URL |
| `rollback/pre-foreclosure` | `1c5a37d` | Exact pre-rebuild rollback point |
| local tag `private-note-capital-pre-foreclosure` | `1c5a37d` | Local only (relay rejects tag push) |

Audit-branch commits added: `6bbe03b` (hardening) + docs commit (this set).

## 3. Rollback vs debt-platform comparison

`git diff rollback/pre-foreclosure debt-platform` = **1 file, `lib/site.ts`, +6/−2** — the
intended canonical/OG URL change to `debt.privatenotecapital.com`. **No other differences. No
silent repairs.** debt-platform contains the full original app (pages, InvestorIntake /
BookReview / YieldIllustrator components, `/api/investor-lead` + `/api/book-review`,
`grcrm-client`, `notify`, hero `pnc-hero.mp4`, security headers, original deps). **Preserved
application verified.**

## 4. Current main architecture

Next.js 14 (App Router, TS) · Tailwind · Supabase (Postgres + Auth, RLS) · Netlify
(`@netlify/plugin-nextjs`). Search-first public platform; leads → Supabase + GRCRM
(server-side). Degrades gracefully (empty states) when unconfigured. Full route inventory in
§9; data model in `docs/PREDEPLOYMENT-DATABASE-AUDIT.md`.

## 5. Vulnerabilities / findings

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | Medium | Server-secret env **names** shipped in client bundle (`lib/env.ts` imported by client). No secret **value** leaked (non-public env is `undefined` client-side). | **Fixed** — split public/server env; bundle re-scan clean |
| 2 | Medium | CSV **formula injection** not neutralized on export | **Fixed** — `neutralizeFormula` on rejected-CSV export |
| 3 | Low | Uploaded **filename** stored unsanitized | **Fixed** — `sanitizeFilename` + CSV MIME check |
| 4 | Medium | No **bot/honeypot** on public forms (rate-limit only) | **Fixed** — honeypot on financing + watchlist |
| 5 | Low | **PII (email)** in a server log line | **Fixed** — logs action only |
| 6 | Low | Missing **HSTS** | **Fixed** — added; CSP deferred (see §note) |
| 7 | **High** | **Next.js 14.2.35** has many HIGH advisories (SSRF in Server Actions/rewrites, cache poisoning, CSP-nonce XSS, unauthenticated Server Function endpoint disclosure, request smuggling) — fixed only in ≥15.5.21 | **BLOCKER** — documented; needs major upgrade + revalidation (not forced in audit) |
| 8 | Low | `brace-expansion` DoS (transitive, build-time) | Documented; safe `npm` fix available |
| 9 | Info | GRCRM structured-contract unverifiable from this repo | Documented blocker (see §10) |
| 10 | Info | GRCRM webhook has **no timeout/retry** | Recommendation (lead still persisted + emailed) |

**CSP note:** a Content-Security-Policy is intentionally **not** added here — it must be
authored against the live Supabase URL and tested so it does not break auth/assets. Proposed
directive to test in staging: allow `self`, the Supabase project origin (script/style/connect),
`data:` images; then enforce.

## 6. Corrections made (this branch only)

Env split (client-safe public vs server-only secrets + browser guard); CSV formula
neutralization on export; filename sanitization + MIME check; honeypot bot protection on both
public forms; PII-safe logging; HSTS header; +3 unit tests. Product, routes, stack, and
preserved branches unchanged.

## 7. Files changed (audit branch)

`lib/env.ts`, **`lib/env.server.ts` (new)**, `lib/supabase/client.ts`,
`lib/supabase/server.ts`, `lib/crm.ts`, `lib/csv.ts`, `lib/validation.ts`,
`app/api/admin/import/route.ts`, `app/api/financing/route.ts`, `app/api/watchlist/route.ts`,
`components/admin/ImportWizard.tsx`, `components/forms/FinancingForm.tsx`,
`components/forms/WatchlistForm.tsx`, `netlify.toml`, `tests/csv.test.ts`,
`tests/validation.test.ts`, plus the docs in §8.

## 8. Migration & RLS audit

Full detail + verification SQL in `docs/PREDEPLOYMENT-DATABASE-AUDIT.md`. Summary: RLS enabled
on all 7 tables; public reads limited to `record_status='published'`; property/auction/import
writes are service-role only; users are scoped to their own `saved_properties`/`search_alerts`;
`property_interests` are private (server-write, owner-read); `import_jobs` admin-read;
`admin_users` self-read. **Not applied/verified against a live DB (per instructions)** — run
queries 1–8 in staging before go-live.

## 9. Endpoint & page authorization matrix

| Route | Render | Auth required | Authorization | Data source | Empty/err |
|---|---|---|---|---|---|
| `/` | Server (dynamic) | No | Public | `foreclosure_properties` (published) | Hides empty sections |
| `/search` | Server | No | Public | published only (RLS) | Empty/loading/error states |
| `/property/[id]` | Server | No | Public; **404 if not published** | published row | Soft "not available" if unconfigured |
| `/calendar` | Server | No | Public | published, future auctions | Empty state |
| `/watchlist` | Server + form | No | Public POST → consent required | `search_alerts` (server insert) | Validation errors |
| `/financing` | Server + form | No | Public POST | `property_interests` (server) | Validation errors |
| `/saved` | Server | **Yes** | `getCurrentUser`; own rows via RLS | `saved_properties` | Sign-in prompt |
| `/login` | Server + client | No | Supabase Auth | — | Auth errors |
| `/admin/import` | Server | **Yes + admin** | `isAdmin()` (admin_users, service role) in layout **and** route | `import_jobs`, upsert | 403 non-admin |
| `/about-data`,`/privacy`,`/terms`,`/contact` | Server/static | No | Public | static | — |
| `POST /api/search` | Route | No | Public (RLS published only) | published | JSON empty |
| `POST /api/financing` | Route | No | rate-limit + honeypot + server validation | insert + GRCRM | 400/429 |
| `POST /api/watchlist` | Route | No | rate-limit + honeypot + **consent** + validation | insert + GRCRM | 400/429 |
| `POST/DELETE /api/saved` | Route | **Yes** | `getCurrentUser`; RLS owner-only | `saved_properties` | 401 |
| `POST /api/admin/import` | Route | **Yes + admin** | `isAdmin()`; service role | upsert + jobs | 403/413/415 |

Authorization is **server-side** (RLS + `isAdmin` via service role) — not client route guards,
client-supplied email/role, or hidden buttons. Verified by smoke tests (401/403 returned).

## 10. GRCRM verification status

Server-side only; URL/secret not in client bundle (verified); optional HMAC; consent recorded;
property data never in the contact name (unit-tested). **Blocker:** the receiving contract
beyond `{name,email,phone,message}` cannot be verified from this repo (GRCRM = separate
`westccmortgage/crm`). **Gap:** no timeout/retry (lead is still persisted + emailed on
failure). Full payload + fictional test in `docs/GRCRM-INTEGRATION-VERIFICATION.md`.

## 11. Property-data licensing controls

`record_status`+RLS gate public visibility; adapter `publicDisplayAllowed` decides
published-vs-draft at import; PropertyRadar/ForeclosureRadar is `draft`-only until a
public-display license is confirmed. No fabricated listings; no seed data. Detail in
`docs/PROPERTY-DATA-PUBLICATION-CONTROLS.md`. **No data license is claimed or verified.**

## 12. Test commands & totals

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npx next lint` | exit 0, no warnings |
| `npx tsx --test tests/*.test.ts` | **33 pass / 0 fail / 0 skipped** |
| `npm audit` | 6 high (Next.js/postcss → §5 #7; brace-expansion → #8) |

Smoke tests: all pages 200; `/api/financing` 400 (missing phone) / ok (valid) / ok+dropped
(honeypot); `/api/watchlist` 400 (no consent); `/api/saved` 401 (unauth);
`/api/admin/import` 403 (non-admin) / 415 (non-CSV).

## 13. Production build

`next build` exit 0; 17 routes; static+dynamic split as expected. Client-bundle secret-name
scan: **clean** (only the 4 `NEXT_PUBLIC_*` vars present; no `service_role` value).

## 14. Mobile / accessibility

No horizontal overflow at **390 / 430 / 768 / 1024 / 1440** (functional check). Mobile menu
opens with `aria-expanded=true`; filters open in a bottom-sheet drawer; visible focus ring
(global `:focus-visible`); form labels present. Deeper AT/contrast pass recommended pre-launch.

## 15. Required Netlify sites & settings

Two independent sites (Site A `main` → apex; Site B `debt-platform` → subdomain), Next.js
runtime (not static). Full matrix in `docs/NETLIFY-RELEASE-RUNBOOK.md`.

## 16. Required Supabase configuration

One project; apply `0001`+`0002`; run verification SQL; enable Email auth; add apex to the
redirect allow-list; seed `admin_users` via service role. Detail in the runbook + DB audit.

## 17. Required environment variables

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public);
`SUPABASE_SERVICE_ROLE`, `GRCRM_LEAD_WEBHOOK_URL`(/`GRCRM_WEBHOOK_URL`),
`GRCRM_WEBHOOK_SECRET`, one email provider key, `NOTIFY_EMAIL`/`NOTIFY_FROM` (secret);
optional `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DEBT_PLATFORM_URL`.

## 18. Unresolved blockers

1. **Next.js security upgrade** (High) — upgrade to ≥15.5.21 (or current 16.x), which requires
   making `cookies()`/`headers()` awaited, re-validating `@netlify/plugin-nextjs`, and full
   re-test. Not performed in this audit (would be an unvalidated stack change).
2. **Apply + verify migrations in staging** (RLS queries 1–8). Owner infra.
3. **Provision Supabase + set env** (service role, GRCRM secret). Owner infra/credentials.
4. **DNS + custom domains + TLS** for both sites. Owner infra.
5. **Confirm the GRCRM receiving contract** (separate `crm` repo) for structured fields; add
   timeout/retry. Owner/integration.
6. **Data-display licensing** for restricted CA sources before publishing them.
7. **CSP** authored + tested against the live Supabase origin.
8. Legal/compliance review of financing + disclosure language (see §note below).

**Compliance note (not legal advice):** financing language uses "review / not a commitment to
lend / not guaranteed / subject to review"; the platform is positioned as property-data +
financing-inquiry, not foreclosure rescue or debt relief; `lib/company.ts` carries the
company identity (West Coast Capital Mortgage Inc., NMLS 2817729). Have counsel confirm the
DRE/NMLS disclosures and the exact placement of individual broker license numbers before
go-live.

## 19. Rollback instructions

See `docs/rollback.md`. Fastest apex rollback: point Site A's production branch to
`rollback/pre-foreclosure`. Bad deploy: `git revert` on `main`. Bad data:
`update foreclosure_properties set record_status='archived' …`. Preserved branches are
untouched by this audit.

---

## 20. FINAL RELEASE STATUS

**NOT READY — BLOCKERS REMAIN**

The application is architecturally sound: the preserved investor app is verified intact, the
authorization model is server-side and default-deny, no secret value is exposed, public forms
are validated + rate-limited + honeypot-protected, property publication controls prevent
unlicensed/draft data from showing, there is no fabricated data, and all local tests + the
production build pass. The security corrections in §6 are committed on this branch.

It is **not READY** because open blockers exceed the "credentials / DNS / licensed data /
owner-infra" bar the READY status requires — specifically the **Next.js 14.2.35 HIGH
advisories** (a framework security upgrade + revalidation), plus **live RLS verification not
yet performed** and the **unconfirmed GRCRM contract**. Resolve §18 items 1–5 (and apply the
DB migrations with the verification queries green) and this moves to **READY FOR CONTROLLED
STAGING**.
