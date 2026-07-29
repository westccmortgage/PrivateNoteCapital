# Debt subdomain migration — `debt.privatenotecapital.com`

**Purpose:** preserve the existing Private Note Capital investor application, unchanged,
on a dedicated subdomain, so the apex domain can be rebuilt as the foreclosure platform.

**Status:** repository work **complete**; Netlify site creation + DNS are **infrastructure
steps to be executed by an operator** (this environment has no Netlify/DNS access). Every
required value is specified below.

---

## 1. Source of truth

| Item | Value |
|---|---|
| Repository | `westccmortgage/PrivateNoteCapital` |
| Deploy branch | **`debt-platform`** |
| Branch tip | `9b5d5c2` |
| Base (pre-foreclosure) commit | `1c5a37d` — also on branch `rollback/pre-foreclosure` and local tag `private-note-capital-pre-foreclosure` |

The `debt-platform` branch is the pre-foreclosure production code with **exactly one
intentional change**: `lib/site.ts` `domain`/`url` now point at `debt.privatenotecapital.com`
so canonical and Open Graph URLs match the subdomain the app is served from. Diff:

```
- domain: "privatenotecapital.com",
- url: "https://privatenotecapital.com",
+ domain: "debt.privatenotecapital.com",
+ url: "https://debt.privatenotecapital.com",
```

No other file differs from `1c5a37d`. All pages, the investor-intake and book-review
forms, the GRCRM webhook forwarding, the email fallback, environment variables, and the
security headers are preserved.

## 2. Netlify site (to create)

| Setting | Value |
|---|---|
| Suggested site name | `private-note-capital-debt` |
| Repository | `westccmortgage/PrivateNoteCapital` |
| **Production branch** | `debt-platform` |
| Build command | `npm run build` *(unchanged)* |
| Publish directory | `.next` *(unchanged)* |
| Node version | `20` *(from `netlify.toml`)* |
| Plugin | `@netlify/plugin-nextjs` *(already in `netlify.toml`)* |
| Custom domain | `debt.privatenotecapital.com` |

> Create this as a **second, independent Netlify site** — do **not** repoint the existing
> production site's branch. After the apex rebuild, the two domains must build from two
> different branches (`main` → apex, `debt-platform` → subdomain).

## 3. DNS records (to add)

At the DNS provider for `privatenotecapital.com`, add the subdomain and point it at the
new Netlify site:

| Type | Host | Value |
|---|---|---|
| `CNAME` | `debt` | `<new-netlify-site>.netlify.app` |

(or an `ALIAS`/`A` per Netlify's instructions for that site). Enable HTTPS (Let's Encrypt)
in Netlify once DNS resolves.

## 4. Environment variables to transfer

Copy the **same values** currently set on the existing production Netlify site into the
new `private-note-capital-debt` site (all optional, but transfer whatever is set today):

- `GRCRM_LEAD_WEBHOOK_URL` (or `GRCRM_WEBHOOK_URL`)
- `RESEND_API_KEY` **or** `WEB3FORMS_ACCESS_KEY` **or** `FORMSUBMIT_EMAIL`
- `NOTIFY_EMAIL`, `NOTIFY_FROM` (if set)
- `NEXT_PUBLIC_BOOKING_URL` (if set)

There are **no** `SUPABASE_*` keys, no service-role key, and no auth secrets in this app —
nothing else to copy.

## 5. Authentication changes

**None.** The app has no authentication, no OAuth, and no auth callback URLs. There is
nothing to update in any identity provider.

## 6. Supabase redirect / CORS changes

**None required.** This app does not use Supabase and makes only same-origin API calls, so
there are no Supabase redirect allow-lists or CORS rules to change for the subdomain.

*(The GRCRM webhook is an outbound server-to-server POST; it is unaffected by the domain
change. If GRCRM validates an `Origin`/referrer allow-list on its inbound webhook, add
`https://debt.privatenotecapital.com` there — see `docs/grcrm-integration.md`.)*

## 7. Email & webhook functionality

Preserved unchanged. Both forms (`/api/investor-lead`, `/api/book-review`) forward to GRCRM
and optionally email via the same server-side code. With the env vars from §4 in place,
behavior on the subdomain is identical to today.

## 8. Database records

**N/A** — the app persists no records. Nothing to migrate, back up, or restore.

## 9. Test plan (run against the subdomain before the apex rebuild goes live)

1. `https://debt.privatenotecapital.com/` renders; hero, investor intake visible.
2. `/company`, `/faq`, `/legal` render.
3. `/robots.txt` and `/sitemap.xml` return the **subdomain** URLs (verifies the site.ts change).
4. Submit the **investor-intake** form with consent → expect the success message; confirm the lead arrives in GRCRM and/or the notification email.
5. Submit **book-review** → same confirmation path.
6. Submit investor intake **without consent** → expect the 400 consent error (server-side validation intact).
7. Security headers present on `/` (`X-Frame-Options: SAMEORIGIN`, etc.).

**Test results:** _to be recorded by the operator after the site is created._ The
repository-level equivalents (build succeeds, routes compile, forms validate server-side)
are covered by `npm run build` on this branch.

## 10. Rollback procedure

See `docs/rollback.md`. In brief:
- The subdomain site is additive; deleting the new Netlify site + the `debt` DNS record
  fully removes it with no effect on the apex.
- The exact pre-foreclosure code is preserved at commit `1c5a37d` (branch
  `rollback/pre-foreclosure`; local tag `private-note-capital-pre-foreclosure`). To restore
  the apex to its pre-foreclosure state, point the apex Netlify site's production branch at
  `rollback/pre-foreclosure` (or reset `main` to `1c5a37d`).

## 11. Known infrastructure blockers (require operator/credentials)

| Blocker | Why | Who resolves |
|---|---|---|
| Create the Netlify `private-note-capital-debt` site | No Netlify API/dashboard access in this environment | Operator |
| Add `debt` CNAME + issue TLS | No DNS access | Operator |
| Copy env var **values** | Values are secrets, not in the repo | Operator |
| Push the annotated tag `private-note-capital-pre-foreclosure` | The session git relay accepts branch refs but rejects tag refs; the tag exists locally and the same commit is preserved as branch `rollback/pre-foreclosure` | Run once from a machine with direct git access: `git push origin private-note-capital-pre-foreclosure` |
