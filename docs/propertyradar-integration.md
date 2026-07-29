# PropertyRadar / ForeclosureRadar integration

**Status: PLACEHOLDER — not activated.** No credentials, affiliate IDs, API keys, or
proprietary source URLs are hardcoded anywhere in this repo. This document describes what is
implemented, what needs partner approval, and where credentials would go.

## What is implemented today

- A **CSV import adapter** (`lib/adapters.ts` → `propertyradar`) that maps an **approved
  PropertyRadar/ForeclosureRadar export** to our canonical fields. It is marked
  `publicDisplayAllowed: false`, so any rows it imports are stored as **`draft`** and are
  **never shown publicly** (RLS only serves `published` rows).
- Environment-variable **placeholders** in `.env.example`:
  `PROPERTYRADAR_API_KEY`, `PROPERTYRADAR_AFFILIATE_ID`, `FORECLOSURERADAR_AFFILIATE_URL`.
  These are unused by code until a real integration is built and approved.
- Property pages link out to a record's `source_url` (an approved outbound/affiliate link is
  fine); no restricted content is reproduced beyond what a display license permits.

## What requires partner approval

| Capability | Requires |
|---|---|
| **Affiliate link** | An approved affiliate/referral agreement + affiliate ID. Store the ID in `PROPERTYRADAR_AFFILIATE_ID` and build the link server-side; do not hardcode. |
| **Approved API** | API access + key (`PROPERTYRADAR_API_KEY`), and a build-out of a server-side fetch adapter. Not built — no invented endpoints. |
| **Approved webhook** | A partner-provided inbound webhook contract. Would be received by a server route validating a shared secret. Not built. |
| **OAuth partner integration** | A partner OAuth app + redirect config. Not built. |

## What requires a public-display / redistribution license

Reproducing PropertyRadar/ForeclosureRadar data **publicly** (i.e. `record_status =
'published'`) requires a confirmed **public-display or redistribution license**. Until that
is in writing:

- Keep the `propertyradar` adapter `publicDisplayAllowed: false` (imports stay `draft`).
- Only display fields the license permits; keep the source clearly identified.
- Prefer outbound links to the source over reproducing restricted fields.

## Where credentials would be configured

Netlify environment variables (server-side; never `NEXT_PUBLIC_`):
`PROPERTYRADAR_API_KEY`, `PROPERTYRADAR_AFFILIATE_ID`, `FORECLOSURERADAR_AFFILIATE_URL`.
When an integration is built, read them via `lib/env.ts` and keep all calls server-side.

## What data is permitted to appear publicly today

Only data from sources marked `publicDisplayAllowed: true` (manual operator CSVs and the
public-record FL county exports), and only after import as `published`. Everything from
restricted sources stays `draft` and private until a license says otherwise.

## Blocker summary

- ❌ **Public display of PropertyRadar/ForeclosureRadar data** — blocked on a
  public-display/redistribution license (business/legal decision).
- ❌ **API/webhook/OAuth ingestion** — blocked on partner approval + credentials.
- ✅ **Approved CSV export import (as draft)** — implemented and usable now.
