# County foreclosure collectors — Palm Beach + Los Angeles

Automatic, server-side collection of foreclosure opportunities from **official
sources only**, into the existing property model, search, and GRCRM lead flow.
CSV upload (`/admin/import`) remains as a backup. No new website, no new Supabase
project, no duplicate property/search tables.

```
OFFICIAL COUNTY SOURCE
  → daily collector (discover)
  → normalized foreclosure event (normalize)
  → property / APN enrichment (official ArcGIS)
  → deterministic dedup (parcel-stable identity)
  → Supabase foreclosure_properties (column-aware upsert)
  → automatic lifecycle updates (auction_events)
  → PrivateNoteCapital.com/search
  → property inquiry / financing lead (GRCRM)
```

## Architecture

| Piece | File |
| --- | --- |
| Shared interface + types | `lib/providers/types.ts` |
| Publication permission gate | `lib/providers/permission.ts` |
| Conservative HTTP (UA, timeout, backoff, cache) | `lib/providers/http.ts` |
| ArcGIS FeatureServer client | `lib/providers/arcgis.ts` |
| Feed parsers (CSV/JSON/XML/ZIP) | `lib/providers/feed.ts` |
| Event → canonical property builder | `lib/providers/event.ts` |
| Palm Beach provider | `lib/providers/palm-beach.ts` |
| LA event-feed + assessor providers | `lib/providers/los-angeles.ts` |
| Persist (upsert + events + audit + reconcile) | `lib/providers/persist.ts` |
| Column-aware writer (shared with CSV import) | `lib/import-writer.ts` |
| Sync orchestrator (overlap-safe, correlation id) | `lib/providers/sync.ts` |
| Admin status assembly | `lib/providers/status.ts` |
| Admin control page + panel | `app/admin/data-sync/page.tsx`, `components/admin/DataSyncPanel.tsx` |
| Admin API (test / sync now) | `app/api/admin/data-sync/route.ts` |
| Protected daily cron endpoint | `app/api/cron/data-sync/route.ts` |
| Netlify scheduled function (09:00 UTC) | `netlify/functions/data-sync-daily.mts` |

Each provider implements the shared `CountyProvider` interface: `testConnection`,
`discoverEvents`, `fetchEventDetails`, `normalizeEvent`, `enrichProperty`,
`syncIncremental`, `reconcileMissingEvents`.

## Compliance model

Every record carries a `SourceMeta` (authority, source type, access method, URL,
collection timestamp, source-updated timestamp) and a **publication permission**:

| Permission | Auto-publishes? |
| --- | --- |
| `public_official` | ✅ |
| `contract_authorized` | ✅ |
| `review_required` | ❌ (held as draft) |
| `restricted` | ❌ (never public) |
| `unknown` | ❌ |

Rules enforced in code:

- Official public sources / ArcGIS FeatureServer / authorized reports only.
- No scraping of ATTOM, PropertyRadar, Zillow, Realtor.com, or any commercial DB.
- No CAPTCHA/auth/rate-limit bypass; no imitation of a logged-in human session.
- Identifiable user agent, timeouts, backoff, caching, bounded requests.
- **Never publish** defendant/borrower/trustor names, phones, or contact data —
  party info is retained only as internal case metadata (`NormalizedEvent.internal`)
  and is never written to the property row.
- Assessed values are labeled assessed values, never market value.
- No fabricated properties. If a source is unreachable or unauthorized, the exact
  blocker is reported and **nothing is published**.

## Palm Beach County (FL) — primary live collector

- **Parcel enrichment** — official Palm Beach County Property Appraiser ArcGIS
  FeatureServer. No credentials (a public service URL is configuration). Set
  `PBC_PARCEL_ARCGIS_URL` to the official layer (`…/FeatureServer/0`).
- **Event source** — an **authorized** machine-readable Clerk auction / ClerkCart
  report (CSV or JSON). Set `PBC_AUCTION_REPORT_URL` (+ `PBC_AUCTION_SOURCE_TYPE`,
  optional `PBC_AUCTION_REPORT_TOKEN`). The public RealAuction calendar is **not**
  scraped without confirmed terms — until the authorized report URL is set, event
  sync is disabled and the panel shows the exact owner action.
- Event identity: case number + sale date. Property identity: PCN → normalized
  address (parcel-stable, so a changed auction date updates one card).

## Los Angeles County (CA) — two independent pieces

LA has no public countywide automated NOD/NOS index, so discovery and enrichment
are separate:

1. **`LAEventFeedProvider`** — a production-ready receiver for an official/licensed
   daily recorded-document feed (NOD / NOS / rescission / trustee's deed). Consumes
   HTTPS **CSV / JSON / XML / ZIP** with no code changes. **Disabled** until a
   lawful feed is configured; the panel then shows exactly:
   *“Los Angeles County foreclosure event feed required. Configure an authorized
   Recorder bulk feed or licensed NOD/NOS daily feed.”*
2. **`LAAssessorEnrichmentProvider`** — official LA County Assessor parcel ArcGIS,
   queried by AIN/APN. Enrichment only — Assessor data never implies foreclosure.

Event identity: recorder document number + recording date (fallback APN + doc type
+ recording date). Property identity: AIN → normalized address.

## Scheduled sync

One daily job (`netlify/functions/data-sync-daily.mts`, 09:00 UTC) POSTs the
protected `/api/cron/data-sync` endpoint with `DATA_SYNC_CRON_SECRET`. The endpoint
runs both providers. Properties: protected (secret-gated, never public), no
overlapping run per county (in-process guard + `provider_sync_runs` lock),
idempotent upserts, bounded requests, correlation id per run, per-county result,
no secrets or PII in logs. LA event sync stays disabled until its feed is set; LA
assessor enrichment can still run for already-received events.

## Migration

`supabase/migrations/0005_provider_sync.sql` (OPTIONAL, additive) adds
provenance columns (`source_authority`, `source_type`, `source_access_method`,
`collected_at`, `publication_permission`, `document_number`) and two bookkeeping
tables (`provider_sync_runs`, `provider_sync_state`). Like 0004, the collectors
write these columns only when they exist, so the app works with or without 0005.

## Owner configuration (Netlify env, server-side only)

| Variable | Purpose |
| --- | --- |
| `DATA_SYNC_CRON_SECRET` | Protects the scheduled sync endpoint (required for any sync). |
| `PBC_PARCEL_ARCGIS_URL` | Official Palm Beach parcel FeatureServer layer URL. |
| `PBC_AUCTION_REPORT_URL` | Authorized Palm Beach auction/ClerkCart report (CSV/JSON). |
| `PBC_AUCTION_SOURCE_TYPE` | `csv` (default) or `json`. |
| `PBC_AUCTION_REPORT_TOKEN` | Optional report token (sent as header/`?token=`, never logged). |
| `PBC_PUBLICATION_ALLOWED` | `true` (default) — official clerk records are public. |
| `LA_FORECLOSURE_FEED_TYPE` | `csv` \| `json` \| `xml` \| `zip` \| `sftp`. |
| `LA_FORECLOSURE_FEED_URL` | HTTPS feed URL (for non-SFTP types). |
| `LA_FORECLOSURE_FEED_USERNAME` / `_PASSWORD` | Feed Basic-auth credentials. |
| `LA_FORECLOSURE_FEED_SFTP_HOST` / `_PATH` | SFTP drop (requires the file-drop worker). |
| `LA_FORECLOSURE_FEED_PUBLICATION_ALLOWED` | `true` only when the license permits public display. |
| `LA_FORECLOSURE_FEED_TIMEZONE` | Feed timezone (default `America/Los_Angeles`). |
| `LA_ASSESSOR_ARCGIS_URL` | Official LA County Assessor parcel FeatureServer layer URL. |

None of these are exposed to the browser; all are read server-side only.
