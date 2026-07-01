# CADeed.com — California Deal Intake Terminal (V3)

A conversational private-capital engine for California real estate. Describe a
deal in plain English; the engine understands hard-money language, runs
deterministic underwriting math, asks intelligent follow-up questions, collects
consent, and routes the structured scenario into **GRCRM** for licensed review
and capital-source matching.

> This is not a loan approval or commitment to lend. All scenarios require
> review by a licensed mortgage professional and/or private capital source.

## Stack

- **Next.js (App Router)** + **TypeScript**
- **Tailwind CSS** (Apple-style minimal UI), **Framer Motion**, **Lucide React**
- **Anthropic Claude** (`@anthropic-ai/sdk`) for extraction / language understanding (server-side)

## Core principle: AI extracts, TypeScript calculates

The AI **only extracts facts and understands language**. Every number is computed
by deterministic TypeScript so results are reproducible and auditable.

- `lib/claude-extract.ts` — Anthropic Claude with forced tool-use for strict
  structured JSON + a hard-money glossary (1st/2nd, "firs loan", "3mil", etc.).
- `lib/mock-extractor.ts` — deterministic fallback so the app works **without**
  `ANTHROPIC_API_KEY`, including short multi-turn answers.
- `lib/deal-calculator.ts` — LTV, **CLTV (primary for 2nd position)**, LTC,
  ARV-LTV, equity, capital path, strength, risk notes, missing info, next-best
  question, quick replies, restructure options, lender-match criteria.
- `lib/scenario-merger.ts` — merges each turn's patch into the running scenario
  **without erasing** known values.
- `lib/private-capital-guidelines.ts` — internal leverage bands / construction
  requirements that shape the language (never lender commitments).
- `lib/compliance-rules.ts` — forbidden-language scrubbing, consent text,
  owner-occupied caution, compliance flags.
- `lib/grcrm-client.ts` — builds and sends GRCRM payloads (HMAC-signed when a
  secret is set; degrades gracefully when not configured).
- `lib/scenario-engine.ts` — ties it together for single-shot and multi-turn.

### Second-position CLTV

For a 2nd-position loan, **CLTV is the primary metric**:

```
CLTV = (existing first loan + requested new loan) / property value
```

e.g. `500k` 2nd behind a `3M` first on a `6M` property → **58.3%** (not the
8.3% new-money LTV).

## Multi-turn flow

1. User describes the deal → 2. engine extracts facts → 3. deterministic math →
4. engine explains what it understood → 5. asks the next best question →
6. user answers naturally (typed, dictated, or quick-reply chip) →
7. scenario updates **without restarting** → 8. repeat until minimum info →
9. **Ready for Broker Review** → consent + contact → sent to GRCRM.

Minimum info before submission: property state/location, value, requested loan,
current debt (if 2nd), lien position, purpose, occupancy, business purpose, exit
strategy, timeline, user role, contact, and **explicit consent**.

## Compliance

The engine never says *approved, declined, guaranteed, funded, rate locked, you
qualify*. It uses *preliminary scenario, possible capital path, subject to
review, may require restructuring, not a commitment to lend*. Consent is required
before anything is sent to GRCRM. Owner-occupied scenarios surface a caution.

## API routes

| Route                   | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `POST /api/chat-deal`   | Multi-turn: extract patch → merge → recalc → respond.  |
| `POST /api/analyze-deal`| Single-shot extraction + calculation.                  |
| `POST /api/save-scenario`| Requires consent; builds + sends the GRCRM payload.   |
| `POST /api/capital-source`| Capital-source lending box → GRCRM `capitalSourceProfile`. |

## For Capital Sources

`/for-capital-sources` collects a lending box (states, lien positions, LTV/CLTV,
loan range, property types, programs, owner-occupied/business-purpose, response
time) and sends it to GRCRM as `capitalSourceProfile`.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — the app runs without keys
npm run dev                  # http://localhost:3000
npm run build                # production build
npm test                     # deterministic scenario tests (8 cases)
```

### Environment variables

| Variable               | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `ANTHROPIC_API_KEY`    | Claude key. If absent, the deterministic fallback is used.   |
| `ANTHROPIC_MODEL`      | Model id (default `claude-haiku-4-5`).                       |
| `GRCRM_WEBHOOK_URL`    | If set, scenarios/profiles are POSTed here. Optional.        |
| `GRCRM_WEBHOOK_SECRET` | If set, payloads are HMAC-SHA256 signed. Optional.           |

No secrets are committed — only `.env.example`. Set real values in Netlify.

## Deploy (Netlify)

`netlify.toml` uses `@netlify/plugin-nextjs`. Pushing to the configured branch
triggers an automatic build. Set the environment variables in the Netlify
dashboard.

## Tests

`npm test` runs `scripts/test-scenarios.mts` (via `tsx`) covering: 2nd-position
CLTV (58.3%), cash-out CLTV (68.3%), fix & flip, construction completion,
owner-occupied caution, business-purpose follow-up, consent gating, and graceful
behavior when GRCRM is not configured.
