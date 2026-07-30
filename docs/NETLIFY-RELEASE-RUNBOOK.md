# Netlify release runbook — one site

**Superseded plan note:** the previous two-site (foreclosure + `debt.` subdomain) runbook is
retired by owner decision. There is now **one** Netlify site, **one** branch (`main`), **one**
domain. Private Debt is the internal `/private-debt` section. See `docs/deployment.md` for the
authoritative single-site steps.

## Single site

| Field | Value |
|---|---|
| Repository | `westccmortgage/PrivateNoteCapital` |
| Production branch | `main` |
| Build command | `npm run build` |
| Publish | `.next` via `@netlify/plugin-nextjs` v5 (SSR, not static) |
| Node | 20 |
| Custom domain | `privatenotecapital.com` (+ `www` → apex) |
| Health check | `GET /` → 200; `GET /search` → 200; `GET /private-debt` → 200 |
| Rollback branch | `rollback/pre-foreclosure` |

## Framework compatibility

Next.js **15.5.22** (security-backport line) · React 18.3.1 · `@netlify/plugin-nextjs` v5
supports Next 15 · Node 20 satisfies engines. No `netlify.toml` change needed for the upgrade;
`[[plugins]] package="@netlify/plugin-nextjs"` lets Netlify manage the runtime.

## Environment / Supabase / gate / smoke / rollback

All covered in `docs/deployment.md`, `docs/STAGING-ENVIRONMENT-MATRIX.md`,
`docs/STAGING-SUPABASE-VERIFICATION.md`, and `docs/rollback.md`. Pre-deploy gate:
`npm ci && npm run typecheck && npm run lint && npm test && npm run build && npm audit
--omit=dev` (0 production vulnerabilities).
