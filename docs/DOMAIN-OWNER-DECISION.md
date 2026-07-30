# Domain map — for owner approval

**No DNS was changed.** This proposes options; the owner picks one. The code
defaults to Option A (apex = foreclosure, `debt.` = investor) but every domain is
overridable via `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_DEBT_PLATFORM_URL`, so no
final decision is baked in.

## Brands to place

1. **Foreclosure & Auction Intelligence** platform (new, `main`).
2. **Private Debt / investor** platform (preserved, `debt-platform`).
3. (Future) any **parent Private Note Capital** brand page.

## Option A — Foreclosure at the apex (current default)

| Property | Domain | Branch |
|---|---|---|
| Foreclosure platform | `privatenotecapital.com` (+ `www` → apex) | `main` |
| Investor/debt platform | `debt.privatenotecapital.com` | `debt-platform` |

- **Canonical:** apex → foreclosure; `debt.` self-canonical.
- **SEO:** foreclosure content gets the primary domain authority; investor app is
  a small, self-contained subdomain.
- **Auth/cookies:** separate hosts → separate cookie scopes → clean isolation.
- **Supabase redirect URLs:** add `https://privatenotecapital.com`.
- **Netlify:** Site A → apex; Site B → `debt.`.
- **Rollback:** point Site A's branch to `rollback/pre-foreclosure` to restore the
  original investor site at the apex.

## Option B — Foreclosure on a subdomain, apex reserved for a parent brand

| Property | Domain | Branch |
|---|---|---|
| Parent brand / chooser | `privatenotecapital.com` | (future) |
| Foreclosure platform | `foreclosure.privatenotecapital.com` | `main` |
| Investor/debt platform | `debt.privatenotecapital.com` | `debt-platform` |

- **Canonical:** each subdomain self-canonical; apex hosts a brand landing.
- **SEO:** foreclosure authority accrues to the subdomain (weaker than apex).
- **Auth/cookies:** three clean host scopes.
- **Supabase redirect URLs:** add `https://foreclosure.privatenotecapital.com`.
- Requires building an apex parent page later (out of scope now).

## Option C — Keep investor app at the apex, foreclosure on a subdomain

| Property | Domain | Branch |
|---|---|---|
| Investor/debt platform | `privatenotecapital.com` | `debt-platform` |
| Foreclosure platform | `foreclosure.privatenotecapital.com` | `main` |

- Preserves the existing apex identity; foreclosure is additive.
- **SEO:** investor app keeps apex authority; foreclosure starts fresh on a sub.
- Set `NEXT_PUBLIC_SITE_URL=https://foreclosure.privatenotecapital.com` and update
  `debt-platform`'s `lib/site.ts` back to the apex.

## Collision check

- No accidental canonical collision: each surface is a distinct host and
  self-canonical; the foreclosure app never emits the investor app's URLs and
  vice-versa. Verified: `robots.ts`/`sitemap.ts`/OG all derive from `SITE.url`
  (env-overridable) — set it per site to avoid cross-canonicalization.
- The single **Private Debt Platform** footer link points at
  `NEXT_PUBLIC_DEBT_PLATFORM_URL` — set it to whichever host hosts the investor
  app in the chosen option.

## Recommendation

**Option A** (default): simplest, gives the new lead-gen platform apex authority,
and the preserved investor app a stable, isolated subdomain. Owner to confirm
before DNS is configured.
