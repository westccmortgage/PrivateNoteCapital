# Current Private Note Capital system — technical inventory

**Audit date:** 2026-07-29
**Repository:** `westccmortgage/PrivateNoteCapital`
**Audited commit:** `1c5a37d` (tagged locally `private-note-capital-pre-foreclosure`, mirrored to remote branch `rollback/pre-foreclosure`)

This document records **only what actually exists** in the repository at the audited
commit. Where the repo's own `README.md` describes features that are **not present** in
the code, that discrepancy is called out explicitly. Nothing here is inferred from
external systems.

> **Preservation scope.** This is the application that must continue to work unchanged at
> `debt.privatenotecapital.com` (branch `debt-platform`). The new foreclosure platform is
> a separate rebuild on `main`.

---

## 1. Framework & stack

| Concern | Actual value (from repo) |
|---|---|
| Framework | **Next.js 14** (App Router) — `next ^14.2.35` |
| Language | TypeScript 5.5 (`tsconfig.json`, `strict`) |
| UI | Tailwind CSS 3.4, Framer Motion 11, Lucide React |
| AI SDK | `@anthropic-ai/sdk ^0.70.0` is a dependency, **but no source file imports it** at this commit (see §9 discrepancies) |
| Node | `20` (`.nvmrc`, `netlify.toml` `NODE_VERSION`) |
| Package manager | npm (`package-lock.json` committed) |

## 2. Build commands

| Script | Command |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `test` | `tsx scripts/test-scenarios.mts` — **script file is not present** in the repo at this commit (see §9) |

Production build command used by Netlify: **`npm run build`**, publish dir **`.next`**.

## 3. Production branch & hosting

- **Host:** Netlify, via the official `@netlify/plugin-nextjs` plugin (declared in `netlify.toml`).
- **Production branch:** `main` (Netlify builds the configured production branch; the repo default branch is `main`).
- **Publish directory:** `.next`.
- No `_redirects` file and no `[[redirects]]` blocks exist. Routing is entirely Next.js App Router. The Netlix Next plugin handles SSR/functions.

## 4. Netlify configuration (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = ".next"
[build.environment]
  NODE_VERSION = "20"
[[plugins]]
  package = "@netlify/plugin-nextjs"
[[headers]]                     # baseline security headers, applied to /*
  X-Content-Type-Options = "nosniff"
  X-Frame-Options = "SAMEORIGIN"
  Referrer-Policy = "strict-origin-when-cross-origin"
  Permissions-Policy = "microphone=(self), camera=(), geolocation=()"
```

## 5. Routes (App Router)

| Route | File | Type |
|---|---|---|
| `/` | `app/page.tsx` | Page — marketing + investor intake |
| `/company` | `app/company/page.tsx` | Page |
| `/faq` | `app/faq/page.tsx` | Page |
| `/legal` | `app/legal/page.tsx` | Page |
| `/robots.txt` | `app/robots.ts` | Metadata route |
| `/sitemap.xml` | `app/sitemap.ts` | Metadata route |
| `/api/investor-lead` | `app/api/investor-lead/route.ts` | **API route (POST)** — consent-gated capital-partner intake |
| `/api/book-review` | `app/api/book-review/route.ts` | **API route (POST)** — "book a deal review" request |
| 404 | `app/not-found.tsx` | Page |

`app/layout.tsx` sets metadata from `lib/site.ts`, loads the Playfair Display font, and
applies the `bg-engine-field` background.

## 6. Components & libraries

**`components/`:** `Header`, `Footer`, `PageShell`, `AvatarHero`, `FeatureStrip`,
`YieldIllustrator`, `InvestorIntake`, `BookReview`, `ComplianceNotice`.

**`lib/`:**
- `site.ts` — brand/site config (name, domain, url, tagline, description; `BOOKING_URL`).
- `company.ts` — **legal identity (confirmed, reusable):** West Coast Capital Mortgage Inc., NMLS **2817729**, office 310-654-1577, direct 310-686-5053, `westccmortgage@gmail.com`, 150 E Olive Ave Unit 112, Burbank, CA 91502.
- `grcrm-client.ts` — GRCRM lead forwarding (see §7).
- `notify.ts` — optional email forwarding (see §7).
- `compliance-rules.ts`, `private-capital-guidelines.ts`, `trust-deed.ts`, `format.ts`, `types.ts` — domain/compliance helpers.

## 7. External integrations

### GRCRM (lead forwarding) — `lib/grcrm-client.ts`
- Forwards a lead to a GRCRM **lead-inbound webhook** as `{ name, email, phone, message }`.
- URL from env `GRCRM_LEAD_WEBHOOK_URL` (fallback `GRCRM_WEBHOOK_URL`). Token is embedded in the URL and stays **server-side only** (API routes run with `runtime = "nodejs"`).
- Sends header `X-PNC-Source: PrivateNoteCapital.com`.
- **Best-effort / no-op when unset** — the app works before the webhook is wired.
- This is the **only** GRCRM coupling: a one-way outbound webhook. There is **no** GRCRM API client, no GRCRM database access, no service-role key.

### Email fallback — `lib/notify.ts`
- Auto-detects one provider by env, in priority order: **Resend** (`RESEND_API_KEY`) → **Web3Forms** (`WEB3FORMS_ACCESS_KEY`) → **FormSubmit** (`FORMSUBMIT_EMAIL`).
- Plain `fetch`, no SDK. No-op when none configured. `NOTIFY_EMAIL` / `NOTIFY_FROM` override recipient/sender.

## 8. Authentication, database, storage

**None.** This application has:
- **No authentication** (no `next-auth`, no Supabase auth, no session/cookie login).
- **No database** (no Supabase, Postgres, Prisma, or ORM). `grep` for `supabase` / `createClient` / `getServerSession` returns nothing.
- **No file uploads** and **no storage buckets**.
- **No user accounts or user records.**

All "data" is transient: a form POST is validated server-side, forwarded to GRCRM, and
optionally emailed. Nothing is persisted by this app.

> This materially simplifies the subdomain migration: there are **no database records,
> user accounts, auth callbacks, or storage** to migrate — only environment variables,
> the outbound GRCRM webhook, and email forwarding.

## 9. Environment variables (actual)

From `.env.example` and code references:

| Var | Used by | Required? |
|---|---|---|
| `GRCRM_LEAD_WEBHOOK_URL` | `grcrm-client.ts` | Optional (no-op if unset) |
| `GRCRM_WEBHOOK_URL` | `grcrm-client.ts` (fallback) | Optional |
| `RESEND_API_KEY` | `notify.ts` | Optional |
| `WEB3FORMS_ACCESS_KEY` | `notify.ts` | Optional |
| `FORMSUBMIT_EMAIL` | `notify.ts` | Optional |
| `NOTIFY_EMAIL`, `NOTIFY_FROM` | `notify.ts` | Optional |
| `NEXT_PUBLIC_BOOKING_URL` | `lib/site.ts` (`BOOKING_URL`) | Optional |

**No secrets are committed.** No `SUPABASE_*`, no service-role key, no `ANTHROPIC_API_KEY`
in `.env.example`.

## 10. Redirects, security rules

- **Redirects:** none (no `_redirects`, no `[[redirects]]`).
- **Security headers:** the four headers in `netlify.toml` (§4). No CSP, no CORS config (the app makes only same-origin API calls). No rate limiting.
- **Row-level security:** N/A (no database).

## 11. Discrepancies between README and actual code (documented, not corrected)

The committed `README.md` and `package.json` `description` describe a **"CADeed.com —
California Deal Intake Terminal (V3)"** with an Anthropic-Claude multi-turn deal engine
(`lib/claude-extract.ts`, `lib/mock-extractor.ts`, `lib/deal-calculator.ts`,
`lib/scenario-*.ts`, routes `/api/chat-deal`, `/api/analyze-deal`, `/api/save-scenario`,
`/api/capital-source`, page `/for-capital-sources`, and `scripts/test-scenarios.mts`).

**None of those files, routes, or the test script exist at this commit.** The actual
deployed app is a **simpler investor-intake marketing site** (routes and files enumerated
above). The `@anthropic-ai/sdk` dependency is present but unused. `npm test` and `npm run
lint` will fail/no-op accordingly.

This inventory reflects the **actual code**. The `debt-platform` branch preserves this
actual code byte-for-byte (plus the single canonical-URL change), so nothing described
here is altered by the migration.

## 12. Current production domain configuration

- Intended production domain per `lib/site.ts`: **`privatenotecapital.com`** (used for
  canonical/OG URLs, `sitemap.ts`, `robots.ts`).
- DNS / Netlify custom-domain binding lives in the Netlify dashboard (outside the repo)
  and could not be inspected from the codebase. The migration doc records the DNS/domain
  changes required.
