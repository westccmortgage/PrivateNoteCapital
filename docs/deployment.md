# Deployment — one site

**One Netlify site, one branch (`main`), one domain (`privatenotecapital.com`).** The former
two-site plan is retired (owner decision): Private Debt is now an internal section at
`/private-debt`, not a separate deployment.

| Setting | Value |
|---|---|
| Repository | `westccmortgage/PrivateNoteCapital` |
| Production branch | `main` |
| Build command | `npm run build` |
| Publish | `.next` (SSR via `@netlify/plugin-nextjs` v5 — **not** a static export) |
| Node | 20 |
| Domain | `privatenotecapital.com` (+ `www` → apex) |

## Environment (Netlify → site settings)

See `docs/STAGING-ENVIRONMENT-MATRIX.md` for the full table. Required for full function:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public);
`SUPABASE_SERVICE_ROLE`, `GRCRM_LEAD_WEBHOOK_URL` (token in URL), `GRCRM_WEBHOOK_SECRET`,
one email provider key (secret). Optional: `NEXT_PUBLIC_SITE_URL`. The app builds and renders
with graceful empty states when unset.

If the Netlify secrets scanner flags the two public Supabase values (they legitimately ship
in the client bundle):
`SECRETS_SCAN_OMIT_KEYS="NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY"`.
**Never** omit `SUPABASE_SERVICE_ROLE`.

## Supabase

One project. Apply `0001` → `0002` → `0003`; run the verification SQL in
`docs/STAGING-SUPABASE-VERIFICATION.md`; enable Email auth; seed `admin_users` via the
service role.

### Auth URL configuration (required for password reset)

In Supabase → **Authentication → URL Configuration**, set:

- **Site URL:** `https://privatenotecapital.com`
- **Redirect URLs** (allow-list — add all three):
  - `https://privatenotecapital.com/**`
  - `https://privatenotecapital.com/auth/callback`
  - `https://privatenotecapital.com/auth/reset-password`

The password-recovery email link must be allowed to return to
`/auth/callback` (which exchanges the PKCE code) and forward to
`/auth/reset-password`. Without these entries Supabase rejects the redirect and the
reset link fails. Do not change the Supabase dashboard automatically — set these manually.

The app builds the redirect from `NEXT_PUBLIC_SITE_URL` (or the live origin), never
`localhost`, so recovery emails always point at production.

## Deploy

If `main` is already connected to the Netlify site, pushing to `main` triggers one build.
Pre-deploy gate (must pass): `npm ci && npm run typecheck && npm run lint && npm test &&
npm run build && npm audit --omit=dev` (0 production vulns).

## Smoke test

`/` · `/search?state=FL&county=Broward` · a property page (source/last-updated/disclaimer;
unpublished → 404) · register → save → `/saved` · watchlist (consent) · financing ·
`/private-debt` + investor intake · `/contact` message · `/admin/import` (403 non-admin) ·
mobile drawer, no horizontal overflow · `curl -sI` shows security headers incl. HSTS.

## Rollback

`docs/rollback.md`. Fastest: point the site's production branch to `rollback/pre-foreclosure`,
or `git revert` on `main`.
