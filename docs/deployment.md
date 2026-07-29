# Deployment

Two **independent** Netlify production sites from **one** repo, on **two** branches.

| # | Domain | Branch | Purpose |
|---|---|---|---|
| 1 | `debt.privatenotecapital.com` | `debt-platform` | Preserved private-debt investor app (no redesign) |
| 2 | `privatenotecapital.com` | `main` | New Foreclosure & Auction Intelligence platform |

> Do **not** point both domains at the same branch after the rebuild.

Both are Next.js on Netlify via `@netlify/plugin-nextjs`, build `npm run build`, Node 20.
Site 1's setup is in `docs/debt-subdomain-migration.md`. This doc covers Site 2 (`main`).

## Site 2 — `privatenotecapital.com` (main / foreclosure)

### Netlify
- New or existing production site → repo `westccmortgage/PrivateNoteCapital`,
  **production branch `main`**, build `npm run build`, publish `.next`, Node `20`.
- Custom domain `privatenotecapital.com` (+ `www` redirect if desired).

### Supabase (one project)
1. Create a Supabase project (or reuse an approved one).
2. Run the migrations in order:
   `supabase/migrations/0001_foreclosure_schema.sql`, then `0002_rls_policies.sql`
   (via the Supabase SQL editor or CLI `supabase db push`).
3. Seed at least one admin: `insert into admin_users (user_id, email) values ('<auth-user-uuid>', '<email>');`
   (create the user first via the app's register flow, then insert their id).
4. Enable Email auth (and email confirmation if desired) in Supabase Auth settings.
5. Add the site URLs to Supabase Auth **redirect allow-list**:
   `https://privatenotecapital.com` (and `http://localhost:3000` for dev).

### Environment variables (Netlify → Site 2)
Required for full functionality (app still builds without them, with empty states):

| Var | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon key (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE` | **server** | Imports, lead logging, admin (never `NEXT_PUBLIC_`) |
| `GRCRM_LEAD_WEBHOOK_URL` | server | Lead forwarding (token in URL) |
| `GRCRM_WEBHOOK_SECRET` | server | Optional HMAC signing |
| `RESEND_API_KEY` / `WEB3FORMS_ACCESS_KEY` / `FORMSUBMIT_EMAIL` | server | Email fallback (pick one) |
| `NOTIFY_EMAIL`, `NOTIFY_FROM` | server | Email recipient/sender |
| `NEXT_PUBLIC_SITE_URL` | public | Optional canonical override |
| `NEXT_PUBLIC_DEBT_PLATFORM_URL` | public | Footer link (default `https://debt.privatenotecapital.com`) |

If the Netlify secrets scanner flags the public Supabase values (they legitimately ship in
the client bundle), add to build env:
`SECRETS_SCAN_OMIT_KEYS = "NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY"`.

### DNS
- `privatenotecapital.com` → Netlify Site 2 (apex `A`/`ALIAS` per Netlify).
- `debt` `CNAME` → Netlify Site 1 (see the migration doc).

### Pre-deploy gate (all must pass)
```
npm ci
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm test            # 30 unit tests
npm run build       # next build
```
Do not deploy with broken auth, missing required env, or a failing build. Verify the health
checklist in the final summary / `README`.

## Post-deploy smoke test
1. `/` renders; opportunity sections appear only if data exists.
2. `/search?state=FL&county=Broward` returns results or a clean empty state; URL is shareable.
3. A property page shows source + last-updated + disclaimer.
4. Register → sign in → save a property → it appears in `/saved`.
5. Watchlist subscribe (with consent) succeeds; financing request succeeds; both reach GRCRM.
6. `/admin/import` is 403 for non-admins; admins can validate + commit a small CSV.
7. Mobile: filters open in a drawer; no horizontal overflow.

## CI SessionStart (web sessions)
No special hook is required; standard `npm ci && npm run build` reproduces the deploy build.
