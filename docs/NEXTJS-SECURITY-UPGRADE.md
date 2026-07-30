# Next.js security upgrade

Resolves the pre-deployment audit's High-severity framework blocker.

## Before

| Package | Version |
|---|---|
| next | 14.2.35 |
| react / react-dom | 18.3.1 |
| eslint-config-next | 14.2.35 |
| Node engine | 20 (`.nvmrc`, Netlify) |

`npm audit` on 14.2.35 reported numerous HIGH advisories fixed only in ≥15.5.21,
including: SSRF in Server Actions / rewrites, cache poisoning (RSC + middleware),
CSP-nonce XSS, unauthenticated disclosure of internal Server Function endpoints,
HTTP request smuggling, and image-optimizer DoS.

## Selected target: **Next 15.5.22** (keep React 18.3.1)

| Criterion | Finding |
|---|---|
| Lowest fixed version | Advisories fixed in ≥ 15.5.21 |
| Chosen | **15.5.22** — the latest of the maintained `backport` dist-tag (security backports on the 15.5 line) |
| React | **Kept at 18.3.1** — 15.5.22 peer allows `^18.2.0`; no forced React 19 jump |
| eslint-config-next | 15.5.22 (matched) |
| Node engine | `^18.18 || ^19.8 || >=20` — satisfied by Node 20 |
| Netlify | `@netlify/plugin-nextjs` v5 supports Next 15 |

**Why not 16.x:** Next 16 is a second major (more breaking changes, React 19
required) with no security benefit over the 15.5 backport line. 15.5.22 is the
**smallest safe change** that clears every advisory.

## Breaking changes handled (Next 14 → 15)

| Change | Sites | Fix |
|---|---|---|
| `cookies()` is async | `lib/supabase/server.ts` | `getServerSupabase()` made `async` (`await cookies()`); all callers await it |
| `params` is async | `app/property/[id]/page.tsx` | `params: Promise<{id}>`, `await params` |
| `searchParams` is async | `app/search/page.tsx`, `app/financing/page.tsx` | `searchParams: Promise<…>`, awaited |
| fetch cache default → no-store | (none) | App uses Supabase client, not fetch caching — no impact |
| `next/image` / remotePatterns | (none) | App uses no `next/image`; sharp dropped entirely |

No `any`, `@ts-ignore`, `eslint-disable`, or blanket `force-dynamic` was added to
silence the migration. Static/dynamic rendering of each route is preserved
(static pages stayed static; only data/param-driven routes are dynamic).

## Dependency audit resolution

- `overrides`: `postcss ^8.5.25` (was 8.5.16, clears postcss advisories) and
  `sharp ^0.35.3`. sharp is then **not installed at all** (optional, unused).
- **`npm audit --omit=dev` (production runtime): 0 vulnerabilities.**
- `npm audit` (dev-inclusive): 13 highs, **all in the `eslint@8` build/lint
  toolchain** (brace-expansion/minimatch/glob/rimraf/etc.). These are
  build-time-only, never shipped to the deployed runtime, and pre-date this
  upgrade (eslint-config-next@14 used the same eslint@8 chain). Accepted with
  this documentation; a future migration to ESLint 9 (flat config) clears them
  but is out of scope for a security-patch phase and risks CI churn.

## Verification after upgrade

`tsc --noEmit` 0 · `next lint` 0 · tests 49/49 · `next build` 0 · all 20 routes
present · client-bundle secret scan clean · production audit 0.
