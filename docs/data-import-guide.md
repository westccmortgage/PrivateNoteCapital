# Data import guide

How property data gets into the platform. **Approved sources only** — no scraping, no
fabricated listings in production.

## Load real inventory NOW (owner quick-start)

1. Sign in as an admin and open **`/admin/import`**.
2. Pick a **source profile**: Generic foreclosure CSV, California foreclosure/trustee-sale,
   or Palm Beach / Broward / Miami-Dade County. County profiles auto-fill state + county.
3. Upload the export CSV → **Validate & preview**. The preview shows normalized records,
   which will publish vs stay draft, and *why* a record isn't publishable.
4. Adjust the column mapping if the headers differ (advanced panel), then **Confirm import**.
5. Eligible records publish automatically and appear at **`/search`** immediately; the rest
   stay draft. Use **Publish eligible drafts** to bulk-publish later.

The core import works on migrations `0001–0003` (already applied). Migration
`0004_property_rich_fields.sql` is **optional** — apply it to also capture trustee, case #,
lat/long, unpaid balance, etc. The importer writes only the columns that exist, so it never
breaks whether or not `0004` is applied.

## Publication eligibility & statuses

A row publishes (`record_status='published'`) only when it has a usable address or parcel
identity, a valid CA/FL state, a county, a recognized foreclosure stage, an active lifecycle,
and a source license that permits public display. Otherwise it stays **draft** with reasons.
Cancelled/sold/withdrawn records become **archived** (removed from public search, never
deleted). Public search returns only `published` rows, so draft and archived are invisible.

Dedup identity (repeat imports update in place, preserving the internal id + saved/inquiry
links): **source record id → state|county|normalized-APN → normalized address**.

## Principles (data-source rules)

- Do **not** scrape ForeclosureRadar, PropertyRadar, county sites, or auction platforms
  without explicit permission.
- Do **not** publicly display data obtained under an internal-use-only license. Restricted
  sources import as **draft** (`record_status = 'draft'`) and are never shown publicly.
- Store only data we have the right to store and display. Always preserve the source URL and
  last-updated timestamp. Clearly identify the source on every property.

## Import pipeline

`lib/csv.ts` → `app/api/admin/import/route.ts` → Supabase.

1. **Parse** — quote-aware CSV parser (`parseCsvRecords`) → header + records.
2. **Map** — a `ColumnMap` (canonical field → CSV header). Each source has a default map in
   `lib/adapters.ts`; the admin can override per upload (JSON in the wizard's advanced panel).
3. **Validate + normalize** (`validateImport`):
   - **Required:** `external_id`, `state ∈ {CA, FL}`, and at least one of `address`/`county`.
   - Numbers stripped of `$ ,`; dates coerced to ISO; stage/property-type mapped via synonyms.
   - `estimated_equity` is **derived only** when both value and debt exist (never invented).
   - **Dedup within the file** by `(source, external_id)` — latest row wins; duplicates reported.
   - Invalid rows are **rejected** with reasons and downloadable as CSV.
4. **Commit** — upsert valid rows into `foreclosure_properties` by
   `(source_name, external_id)` (existing update, new create). On change, `auction_events`
   are emitted (`auction_postponed` / `auction_scheduled` / `opening_bid_changed`). An
   `import_jobs` audit row records received/created/updated/rejected + the error log.
   `record_status` is `published` for public-display-allowed sources, else `draft`.

## Admin wizard — `/admin/import`

Admin-only (gated by `admin_users`). Supports: source selection, CSV upload, column mapping
(default + override), **validation preview** (received/valid/rejected/duplicates + first-10
preview), **rejected-row CSV download**, **confirm import**, and **import history**.

## CSV format

Header row required. Canonical headers (source `manual_csv`) match the DB fields directly:

```
external_id,source_url,state,county,city,zip,address,apn,property_type,beds,baths,units,
square_feet,foreclosure_stage,original_auction_date,current_auction_date,opening_bid,
estimated_value,estimated_debt,estimated_equity,occupancy_status,previous_sale_date,
previous_sale_price
```

- `state`: `CA` or `FL`. `foreclosure_stage`: any label the synonym table understands
  (e.g. `Notice of Sale`, `REO`, `Postponed`). `property_type`: `SFR`, `Condo`,
  `Multifamily`, … Dates: ISO or `M/D/YYYY`. Money: digits (with optional `$`/`,`).

## Adding a source

Add a `SourceAdapter` to `lib/adapters.ts` with `id` (stored as `source_name`), `state`,
`publicDisplayAllowed`, a `note`, and a `defaultColumnMap`. FL adapters exist for Palm Beach,
Broward, and Miami-Dade; CA has a generic manual adapter plus a draft-only PropertyRadar map.

## Florida counties (Phase 1)

Palm Beach, Broward, Miami-Dade — public-record foreclosure-sale exports (realforeclose-style
or clerk exports). Confirm each export's terms; preserve the official auction URL as
`source_url`.

## What still requires a decision/credentials

- A confirmed **public-display/redistribution license** for restricted CA data
  (PropertyRadar/ForeclosureRadar) before flipping those imports to `published` — see
  `docs/propertyradar-integration.md`.
- The exact column headers of each county's real export (defaults are adjustable starting
  points, not authoritative).
