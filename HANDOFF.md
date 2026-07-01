# CONTEXT HANDOFF — West Coast Capital Mortgage web projects

You are continuing work started in another session. Read this fully; it is the source of truth for context. The actual CODE lives in GitHub repos (below) — clone them; do not assume local files exist on this machine.

## Who / company
All sites are operated by **West Coast Capital Mortgage Inc.** — NMLS #2817729, 150 E Olive Ave, Unit 112, Burbank, CA 91502, office 310-654-1577, direct 310-686-5053, westccmortgage@gmail.com. The user runs SQL/deploys and provides API tokens. Plan: ~3 sites total on ONE shared foundation.

## Shared stack & conventions
- Next.js 14 App Router + TypeScript (strict) + Tailwind + Framer Motion + Lucide.
- Netlify deploy via `@netlify/plugin-nextjs` (`netlify.toml` at repo root: build `npm run build`, publish `.next`, NODE_VERSION 20). Netlify **auto-builds on push** to the configured branch. Base directory = repo root (empty).
- **Design system:** navy `#071A3D` + gold `#C89A3C`, Apple-style minimal; `max-w-engine` 1120px, `rounded-card`, `shadow-soft/lift`, `hairline` border. Tailwind theme in `tailwind.config.ts`.
- **No fake stats / no fake forms.** Never invent track-record numbers.
- **Compliance language:** never say approved/declined/guaranteed/funded/rate-locked/"you qualify". Preliminary/illustrative language only; consent before sending any lead.
- **Leads → GRCRM lead-inbound webhook.** It expects the FLAT shape `{name,email,phone,message}` (token is in the URL); returns `{ok, contactId}`. `lib/grcrm-client.ts` `sendLeadToGRCRM()` posts exactly that, reading `GRCRM_LEAD_WEBHOOK_URL || GRCRM_WEBHOOK_URL`. DO NOT post a rich/nested payload to it. Same webhook is reused across sites. Optional email fallback via `lib/notify.ts` (Resend → Web3Forms → FormSubmit).
- **Access:** the user provides a fine-grained GitHub PAT (whole account, Contents:Read+write, NO Administration). You can push to existing repos but CANNOT create repos via API — the user creates the empty repo, you push. Ask for a fresh token each session; it is revoked after. NEVER commit tokens/secrets.
- Agent gotcha: in the Bash tool, cwd persists between calls but can reset — prefer absolute paths and `git -C <dir>`.

---

## PROJECT 1 — CADeed.com  (the DEAL/borrower side) — LIVE
- **What:** "California Deal Intake Terminal." Borrower/broker describes a CA real-estate deal in plain English → **Anthropic Claude extracts facts only** → **deterministic TypeScript computes** LTV/CLTV/LTC/ARV/equity → multi-turn "next best question" → consent → routes structured lead to GRCRM. **CLTV is the PRIMARY metric for 2nd-position loans. AI never invents numbers.**
- **Repo:** `github.com/westccmortgage/privateCADeed`, branch `claude/cadeed-production-build-wkxou6` (Netlify auto-deploys this branch → cadeed.com).
- **Local (user's machine):** `/Users/anatoliykanevsky/Downloads/cadeed-v2`. Tests: `npm test` (60+ assertions). Keep build green + tests passing before pushing.
- **AI:** `@anthropic-ai/sdk`, `lib/claude-extract.ts`, forced tool-use, default model `claude-haiku-4-5` (migrated OFF OpenAI). `lib/mock-extractor.ts` = deterministic no-key fallback.
- **Env (Netlify):** `ANTHROPIC_API_KEY` (+ optional `ANTHROPIC_MODEL`), `GRCRM_WEBHOOK_URL` (= GRCRM lead-inbound URL), optional `RESEND_API_KEY`/`NOTIFY_EMAIL`/`NOTIFY_FROM`, `NEXT_PUBLIC_BOOKING_URL`, `NEXT_PUBLIC_CONVENTIONAL_URL`. App works gracefully if any are unset.
- **Key domain rule — construction CLTV:** the senior position a new 2nd sits behind = existing first loan `currentDebt`, OR (for construction) **land (`purchasePrice`) + construction already invested (`rehabBudget`), COMBINED**. See `seniorAheadAmount()` in `lib/deal-calculator.ts`.
- **Conventional-fit router:** when private capital can't serve (leverage above ceiling / owner-occupied / HELOC / value-leverage ≥80%), the result shows a compliant "conventional option may fit better" card routing to **West Coast Capital Mortgage** (`westcoastcapitalmortgage.com`) and captures the lead tagged `CONVENTIONAL_REFERRAL`. See `determineConventionalReferral()` + `components/ConventionalReferralCard.tsx` + `app/api/conventional-referral/route.ts`.
- **Status:** built, tested, deployed. GRCRM lead forwarding wired into all lead routes (save-scenario, conventional-referral, book-review, capital-source).

## PROJECT 2 — PrivateNoteCapital.com  (the CAPITAL/investor side) — IN PROGRESS (this repo)
- **What:** mirror of CADeed for the OTHER side — attracts **investors / capital partners** into conservatively underwritten California **trust-deed / hard-money** private mortgage notes. Same company. No Claude/AI on this site.
- **Repo:** `github.com/westccmortgage/PrivateNoteCapital`, branch `main`. **Netlify site not yet created** — create it: New site → import repo → branch main → base dir empty → env `GRCRM_WEBHOOK_URL` (= GRCRM lead-inbound URL) → domain privatenotecapital.com.
- **Local (user's machine):** `/Users/anatoliykanevsky/Downloads/privatenote-v1` (copied from cadeed-v2, borrower terminal stripped).
- **Design (approved):** light editorial. Navy + gold on soft-blue→white. **Serif = Playfair Display** via `next/font` (Tailwind `font-serif`) for wordmark/hero/section titles; body sans.
- **Hero (`components/AvatarHero.tsx`):** FULL-BLEED background video (`public/videos/pnc-hero.mp4`, grok render, 1264×720). Behavior ported from reference site "markevita": plays ONCE (no loop), holds final frame; autoplay with sound + fallback to muted; corner sound toggle; sound enables on first gesture; IntersectionObserver pauses+mutes when scrolled away (<70% visible) and RESTARTS from 0 on return. Serif headline "Private capital, structured around real estate-backed notes." + CTAs, over a soft left light scrim. TODO: tune object-position crop + text color if the video bg is dark.
- **Components/pages:** `FeatureStrip.tsx` (Structured Opportunities / Collateral Visibility / Capital Control), `Header.tsx` (serif wordmark + nav: How It Works, Opportunities, Capital Sources, About + Request Investor Access), homepage sections (how-it-works, deal-flow, guidelines, protection, illustrator, process, request), `app/faq`, `app/legal` (securities + trust-deed disclosures), `app/company`.
- **Signature feature:** `Trust-Deed Yield Illustrator` (`components/YieldIllustrator.tsx` + `lib/trust-deed.ts illustrateYield`) — interest-only arithmetic (principal×rate×term), bounded, disclaimed as illustration-only.
- **Compliance:** audience = OPEN TO ALL investors → STRONG securities disclaimers everywhere (not an offer of securities, risk of loss, suitability, trust-deed risks). `lib/trust-deed.ts scrubReturnLanguage` blocks "guaranteed returns" etc. Counsel should review before real launch.
- **Leads:** `components/InvestorIntake.tsx` → `app/api/investor-lead/route.ts` → `sendLeadToGRCRM` tagged `[INVESTOR]` + email; consent-gated.

## What's next / open items
1. Create the Netlify site for PrivateNoteCapital, set `GRCRM_WEBHOOK_URL`, point the domain.
2. After deploy, tune the hero video (crop / text legibility) from a live screenshot.
3. Optional: compress the hero video (~12 MB) to ~2–4 MB.
4. Build the 3rd site (TBD) on the same foundation.

## How to continue
1. Ask the user for a fresh fine-grained GitHub PAT (whole account, Contents R/W) and the GRCRM lead-inbound URL.
2. `git clone` the repo you're working on (privateCADeed on its branch, or PrivateNoteCapital main). Treat GitHub as source of truth.
3. Deploy = push to the branch Netlify watches (auto-builds). Keep `npm run build` green (and `npm test` for CADeed) before pushing.
4. Match the existing style; never invent stats; keep compliance language; leads always go to GRCRM in the flat `{name,email,phone,message}` shape.
