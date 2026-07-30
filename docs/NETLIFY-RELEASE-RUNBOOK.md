# Netlify release runbook

Executable steps for two **independent** Netlify sites from one repo. **This audit does not
deploy.** Both are **Next.js SSR** apps — they require the Netlify Next.js runtime and must
**not** be configured as a static `dist/` publish.

## Deployment matrix

| Field | Site A — Foreclosure (new) | Site B — Debt platform (preserved) |
|---|---|---|
| Repository | `westccmortgage/PrivateNoteCapital` | same |
| Production branch | `main` | `debt-platform` |
| Base directory | (repo root) | (repo root) |
| Build command | `npm run build` | `npm run build` |
| Publish directory | `.next` (via `@netlify/plugin-nextjs`) | `.next` (via plugin) |
| Runtime | **`@netlify/plugin-nextjs`** (already in `netlify.toml`) | same (on that branch) |
| Node version | 20 | 20 |
| Custom domain | `privatenotecapital.com` | `debt.privatenotecapital.com` |
| DNS | apex `A`/`ALIAS` → Site A | `CNAME debt` → Site B |
| Health check | `GET /` → 200; `GET /search` → 200 | `GET /` → 200 |
| Rollback branch | `rollback/pre-foreclosure` | `rollback/pre-foreclosure` |

> ⚠️ **Do not point both domains at the same branch.** Site A builds `main`, Site B builds
> `debt-platform`.

## Site A — required environment variables (Netlify → Site settings → Environment)

| Var | Scope | Required for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Search/auth/data |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Search/auth/data |
| `SUPABASE_SERVICE_ROLE` | **secret** | Imports, lead logging, admin |
| `GRCRM_LEAD_WEBHOOK_URL` (or `GRCRM_WEBHOOK_URL`) | secret | Lead forwarding |
| `GRCRM_WEBHOOK_SECRET` | secret | Optional HMAC signing |
| `RESEND_API_KEY` **or** `WEB3FORMS_ACCESS_KEY` **or** `FORMSUBMIT_EMAIL` | secret | Email fallback |
| `NOTIFY_EMAIL`, `NOTIFY_FROM` | secret | Email recipient/sender |
| `NEXT_PUBLIC_SITE_URL` | public | Optional canonical override |
| `NEXT_PUBLIC_DEBT_PLATFORM_URL` | public | Footer link (default set) |

Netlify secrets scanner: the two `NEXT_PUBLIC_SUPABASE_*` values legitimately ship in the
client bundle. If the scanner blocks the build, add:
`SECRETS_SCAN_OMIT_KEYS = "NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY"`.
**Never** omit `SUPABASE_SERVICE_ROLE` from scanning.

## Site B — environment variables

Copy the values currently set on the existing production investor site (all optional):
`GRCRM_LEAD_WEBHOOK_URL`/`GRCRM_WEBHOOK_URL`, one email provider key,
`NOTIFY_EMAIL`/`NOTIFY_FROM`, `NEXT_PUBLIC_BOOKING_URL`. No Supabase/service-role — that app
has no database. See `docs/debt-subdomain-migration.md`.

## Supabase (Site A) — staging first

1. Create/choose a Supabase project (staging, then prod).
2. Apply migrations in order: `0001_foreclosure_schema.sql`, `0002_rls_policies.sql`.
3. Run the verification queries in `docs/PREDEPLOYMENT-DATABASE-AUDIT.md` (1–8). All must pass.
4. Enable Email auth (+ confirmation if desired).
5. Auth → URL config → redirect allow-list: add `https://privatenotecapital.com`
   (and `http://localhost:3000` for dev).
6. Seed an admin: register via the app, then
   `insert into admin_users (user_id, email) values ('<uuid>','<email>');`.

## Pre-deploy gate (must pass — do not deploy otherwise)

```bash
npm ci
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm test            # unit tests
npm run build       # next build (SSR)
```

## Deploy order

1. Deploy **Site B** (`debt-platform`) + `debt` CNAME; run its smoke test.
2. Deploy **Site A** (`main`) with env + Supabase wired; run the smoke test below.
3. Point the apex DNS to Site A last (after Site A verifies on its `*.netlify.app` URL).

## Post-deploy smoke test (Site A)

1. `/` renders; opportunity sections show only if data exists.
2. `/search?state=FL&county=Broward` returns results or a clean empty state; URL is shareable.
3. A property page shows source + last-updated + disclaimer; unpublished id → 404.
4. Register → sign in → save a property → appears in `/saved`; sign out.
5. Second user cannot see the first user's saved list (spot-check).
6. Watchlist (with consent) + financing succeed; confirm the lead reaches GRCRM (and/or email).
7. `/admin/import` → 403 for a non-admin; admin can validate + commit a tiny CSV.
8. Mobile: filter drawer opens; no horizontal overflow.
9. `curl -sI https://privatenotecapital.com/` shows the security headers incl. HSTS.

## Rollback

- Bad Site A deploy: `git revert` on `main` (Netlify redeploys prior good state), or repoint
  Site A's branch to `rollback/pre-foreclosure`.
- Full apex rollback to the pre-foreclosure investor app: point Site A's production branch to
  `rollback/pre-foreclosure`. See `docs/rollback.md`.
