# Staging environment matrix

Placeholders only — **no real secrets in this file.** Set real values in the
Netlify site's environment. Server secrets are accessed only through
`lib/env.server.ts` (browser-guarded); public values through `lib/env.ts`.

| Variable | Public/Secret | Required | Used by | Format / example | If unset | Browser exposure |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | yes (data/auth) | `lib/env.ts` → supabase clients | `https://<ref>.supabase.co` | search/auth show empty states | **allowed** (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | yes | `lib/env.ts` → supabase clients | `eyJhbGciOi…` (anon JWT) | same | **allowed** (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE` | **secret** | yes (imports/leads/admin) | `lib/env.server.ts` → `getAdminSupabase` | service-role JWT | admin/import off; leads not persisted | **PROHIBITED** |
| `GRCRM_LEAD_WEBHOOK_URL` | **secret** | recommended | `lib/env.server.ts` → `sendToGRCRM` | `https://grcrm…/lead-inbound?token=<24hex>` | leads emailed/stored only | **PROHIBITED** |
| `GRCRM_WEBHOOK_URL` | **secret** | optional (fallback) | same | same | — | **PROHIBITED** |
| `GRCRM_WEBHOOK_SECRET` | **secret** | optional | `sendToGRCRM` (HMAC header) | random string | no signature header (receiver ignores it anyway) | **PROHIBITED** |
| `RESEND_API_KEY` | **secret** | optional (email #1) | `lib/notify.ts` | `re_…` | try next provider | **PROHIBITED** |
| `WEB3FORMS_ACCESS_KEY` | **secret** | optional (email #2) | `lib/notify.ts` | uuid | — | **PROHIBITED** |
| `FORMSUBMIT_EMAIL` | **secret** | optional (email #3) | `lib/notify.ts` | `you@example.com` | no email fallback | **PROHIBITED** |
| `NOTIFY_EMAIL` | secret | optional | `lib/notify.ts` | recipient email | uses company email | PROHIBITED |
| `NOTIFY_FROM` | secret | optional | `lib/notify.ts` | `Alerts <no-reply@…>` | provider default | PROHIBITED |
| `NEXT_PUBLIC_SITE_URL` | public | optional | `lib/site.ts` (canonical/OG) | `https://staging.privatenotecapital.com` | defaults to apex | allowed |
| `NEXT_PUBLIC_DEBT_PLATFORM_URL` | public | optional | footer link | `https://debt.privatenotecapital.com` | built-in default | allowed |
| `NODE_VERSION` | build | yes | Netlify build | `20` | Netlify default | n/a |
| `PROPERTYRADAR_API_KEY` etc. | **secret** | not yet | placeholders (`docs/propertyradar-integration.md`) | — | integrations inactive | PROHIBITED |

Notes:
- Only `NEXT_PUBLIC_*` are inlined into the client bundle (verified: bundle
  contains exactly the four NEXT_PUBLIC vars, no secret names/values).
- No variable is duplicated across public/secret. The GRCRM **token lives inside
  the URL** — treat the whole URL as a secret.
- Netlify secrets scanner: if it flags the two public Supabase values (they
  legitimately ship in the client bundle), add
  `SECRETS_SCAN_OMIT_KEYS="NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY"`.
  **Never** omit `SUPABASE_SERVICE_ROLE`.

`.env.example` mirrors this matrix with placeholders.
