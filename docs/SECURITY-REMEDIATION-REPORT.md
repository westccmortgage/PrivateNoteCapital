# Private Note Capital — security remediation report

**Phase:** resolve the code-level + integration-contract blockers from the pre-deployment
audit and prepare a controlled-staging release candidate. **No deploy, no DNS, no production
Supabase, no live GRCRM leads, preserved branches untouched, worked only on the remediation
branch.**

## 1. Repository verification

Repo `westccmortgage/privatenotecapital`; tree clean at start; started on
`grok/private-note-capital-predeployment-audit` @ `c61a7ac`. Preserved branches confirmed
unchanged: `debt-platform` `9b5d5c2`, `rollback/pre-foreclosure` `1c5a37d`, `main` `bc5b73f`.

## 2–4. Branch & commits

- Working branch: **`grok/private-note-capital-security-remediation`** (from `c61a7ac`).
- Commits: `ff30e5b` (Next 15 upgrade + audit cleanup) → `2663e10` (GRCRM reconciliation +
  durability) → docs (this set). Final commit recorded at push.

## 5. Selected Next.js version and reason

**14.2.35 → 15.5.22**, React kept at **18.3.1**. 15.5.22 is the maintained `backport`
security line (≥15.5.21 clears every reported advisory); its peer allows React `^18.2.0`, so
no forced React 19 jump — the **smallest safe major change**. Netlify plugin v5 supports Next
15; Node 20 satisfies engines. Detail: `docs/NEXTJS-SECURITY-UPGRADE.md`.

## 6. Framework migration changes

Next 15 async APIs handled with no `any`/`@ts-ignore`/`eslint-disable`/blanket force-dynamic:
`getServerSupabase()` → async (`await cookies()`) + all callers await; `params` async in
`property/[id]`; `searchParams` async in `search` and `financing`. Static/dynamic split
preserved; all 20 routes present.

## 7. npm audit before/after

| | Before (Next 14) | After (Next 15.5.22 + overrides) |
|---|---|---|
| `npm audit --omit=dev` (production runtime) | multiple HIGH (Next SSRF/cache-poison/etc., sharp, postcss) | **0 vulnerabilities** |
| `npm audit` (dev-inclusive) | high (same + eslint chain) | 13 high — **all eslint@8 build/lint tooling** (not shipped), documented |

Overrides: `postcss ^8.5.25`, `sharp ^0.35.3` (sharp then dropped — unused, no `next/image`).

## 8. Security corrections (this phase, on top of the audit's hardening)

Env split already in place (audit); re-verified. Added: CRM delivery-state classification +
timeout, deterministic event id, durable persist-before-send, PII-safe logs (audit). Client
bundle re-scanned after upgrade: **no secret names/values; only the 4 `NEXT_PUBLIC_*` vars.**

## 9. GRCRM receiver files verified (read-only)

`westccmortgage/crm` → `netlify/functions/lead-inbound.mjs` (+ `_lib/supabase.mjs`,
`lead_sources` table). **Not modified.** Endpoint `POST …/lead-inbound?token=<24-hex>`; token
auth (no HMAC); 64 KB cap; 120/60s rate limit; flat `name/first_name/last_name/email/phone/
message→notes` mapping; structured objects ignored; dedupe by email/phone; no idempotency
key; responses 200/400/401/405/413/429/500/503. Full detail: `docs/GRCRM-CONTRACT-MAPPING.md`.

## 10. Sender/receiver mapping (reconciled)

Added top-level `first_name`/`last_name` (the receiver actually maps them) + `external_event_id`.
All property/financing/auction/consent/UTM context rides in `message`→notes, so **no data is
lost**. Structured objects + HMAC kept but documented **inert** (receiver ignores them).
**GRCRM contract: IMPLEMENTED for flat lead capture; structured Opportunity/Task mapping NOT
IMPLEMENTED by the receiver** (a future GRCRM-side change, not a PNC blocker).

## 11. Delivery durability status

Persist-first (`delivery_state='received'`) → send (8 s timeout) → record outcome. States:
delivered / rejected / retry_pending / sending_unknown / not_configured. Migration `0003`
adds `event_id` + `delivery_state` (**artifact, not applied**). **Durability is live only when
Supabase is configured** — a documented staging-infra requirement, not a code gap. The user is
never told "success" merely because a request was sent; email fallback remains.
Detail: `docs/GRCRM-DELIVERY-FAILURE-MODEL.md`.

## 12. Supabase staging readiness

Migration order 0001→0002→0003; expected objects + 9 verification SQL blocks (RLS enabled,
policy inventory, anon denial, unpublished invisibility, cross-user denial, financing
confidentiality, admin-only import, service-role-only writes). `docs/STAGING-SUPABASE-
VERIFICATION.md`. **Not applied here.**

## 13. Property publication tests

`tests/publication.test.ts`: `runSearch` **always** constrains `record_status='published'`
(recording-mock assertion); returns empty (never fabricates) when unconfigured; restricted
sources import as **draft** (`propertyradar`), permitted sources as published; every
restricted adapter flagged not-public-display. Non-admin publish is blocked at the route
(`isAdmin`) — smoke-verified 403.

## 14. Exact files changed (vs `c61a7ac`)

Code: `package.json`, `package-lock.json`, `lib/supabase/server.ts`, `app/property/[id]/page.tsx`,
`app/search/page.tsx`, `app/financing/page.tsx`, `app/calendar/page.tsx`, `app/saved/page.tsx`,
`app/api/search/route.ts`, `app/api/saved/route.ts`, `lib/opportunities.ts`, `lib/crm.ts`,
`lib/lead.ts`, `supabase/migrations/0003_lead_delivery_state.sql`.
Tests: `tests/grcrm-contract.test.ts` (new), `tests/publication.test.ts` (new).
Docs: `NEXTJS-SECURITY-UPGRADE.md`, `GRCRM-CONTRACT-MAPPING.md`, `GRCRM-DELIVERY-FAILURE-MODEL.md`,
`STAGING-SUPABASE-VERIFICATION.md`, `STAGING-ENVIRONMENT-MATRIX.md`, `DOMAIN-OWNER-DECISION.md`,
`NETLIFY-RELEASE-RUNBOOK.md` (updated), `SECURITY-REMEDIATION-REPORT.md` (this).

## 15. Test commands & totals

| Command | Result |
|---|---|
| `npm ci` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 (Next 15 deprecation notice for `next lint`; still passes) |
| `npm test` | **49 pass / 0 fail / 0 skipped** |
| `npm run build` | exit 0, all 20 routes |
| `npm audit --omit=dev` | **0 vulnerabilities** |
| `npm audit` | 13 high, all dev-only eslint toolchain (documented) |

Smoke: all pages 200; honeypot drop; watchlist consent 400; saved 401; admin import 403; api
search clean-empty. GRCRM verified from source + faithful mock-receiver contract tests (not
mocks alone). Bundle secret scan: clean.

## 16. Build result

`next build` exit 0; SSR via `@netlify/plugin-nextjs` v5; static pages static, dynamic/
data-driven routes dynamic; no `next/image`/sharp.

## 17. Mobile / regression

No horizontal overflow at 390/430/768/1024/1440; mobile menu opens (`aria-expanded`). Footer
Private Debt Platform link intact. Preserved branches unaffected.

## 18. Remaining blockers (owner-controlled — the allowed set)

1. **Apply migrations + run verification SQL in staging** (staging infra).
2. **Provision Supabase + set env** — service role, GRCRM token URL (credentials).
3. **DNS + custom domains + TLS** for both sites (owner) — see `docs/DOMAIN-OWNER-DECISION.md`.
4. **Data-display licensing** for restricted CA sources before publishing them (licensed data;
   restricted stays draft until then).
5. *(Optional, non-blocking)* GRCRM-side handler to map structured Opportunity/Task fields;
   background retry worker for `retry_pending`/`sending_unknown`; ESLint 9 migration to clear
   dev-only audit highs.

## 19. Owner decisions required

- Domain map (Option A/B/C in `docs/DOMAIN-OWNER-DECISION.md`).
- Confirm/obtain any restricted-data display license.
- Legal/compliance sign-off on financing + disclosure language (not legal advice here).
- Whether to add a GRCRM-side structured-mapping handler.

## 20. Rollback instructions

See `docs/rollback.md`. Fastest apex rollback: point Site A's production branch to
`rollback/pre-foreclosure`. Bad deploy: `git revert` on `main`. Bad data:
`update foreclosure_properties set record_status='archived' …`. Preserved branches untouched.

---

## FINAL RELEASE DECISION

**READY FOR CONTROLLED STAGING**

Every code-level and integration-contract blocker from the pre-deployment audit is resolved:
a supported secure Next.js (15.5.22) with **0 production-runtime vulnerabilities**; the full
gate is green (tsc, lint, 49 tests, build, prod audit); preserved branches are unchanged; the
**actual GRCRM receiver contract was verified from source** (not mocks alone) and the sender
payload reconciled to it; no secret leakage (bundle re-scanned); authorization and
property-publication safety are covered by tests and smoke checks; and the staging Supabase +
Netlify runbooks are complete and accurate.

The remaining work is limited to **owner-approved credentials, staging infrastructure, DNS,
and licensed data** — the allowed set for controlled staging. Delivery durability and RLS
enforcement become *live* only once staging Supabase is provisioned and the migrations +
verification SQL are run; that is a staging step, documented and scripted, not an unresolved
code blocker.
