# Property data publication controls

How the platform prevents restricted/unlicensed data from being shown publicly, and how
each source behaves. **No commercial data license is claimed here** — none was found in the
repository or supplied to this audit.

## The core control

Public visibility is gated by **`record_status`** + **RLS**:

- Public/anon reads return **only** rows where `record_status = 'published'` (policy
  `fp_read_published`). `draft`, `archived`, and `rejected` rows are invisible to the public
  and to the search/property/calendar pages (all query `.eq('record_status','published')`).
- On import, `record_status` is decided by the **source adapter's `publicDisplayAllowed`
  flag**, not by the uploader:
  - `publicDisplayAllowed: true` → imported as `published`.
  - `publicDisplayAllowed: false` → imported as `draft` (never public) — see
    `app/api/admin/import/route.ts`.

So "successfully imported" does **not** mean "publicly visible" for restricted sources.

## Source-by-source (from `lib/adapters.ts`)

| Source id | Region | Format | Public display? | On import | Dedup key | Attribution |
|---|---|---|---|---|---|---|
| `manual_csv` | CA (any) | Canonical CSV | ✅ allowed | `published` | `(source, external_id)` | `source_url` preserved |
| `propertyradar` | CA | Approved export CSV | ❌ **not allowed** | `draft` | `(source, external_id)` | `DetailURL`→`source_url` |
| `palm_beach_clerk` | FL Palm Beach | Public-record CSV | ✅ allowed | `published` | `(source, external_id)` | `AuctionURL`→`source_url` |
| `broward_clerk` | FL Broward | Public-record CSV | ✅ allowed | `published` | `(source, external_id)` | `AuctionURL`→`source_url` |
| `miami_dade_clerk` | FL Miami-Dade | Public-record CSV | ✅ allowed | `published` | `(source, external_id)` | `AuctionURL`→`source_url` |

- **Input format:** header CSV; default column map per adapter, overridable at upload.
- **Update behavior:** upsert by `(source_name, external_id)`; existing rows update, new rows
  create. Auction-date / opening-bid changes emit `auction_events`.
- **Deletion behavior:** imports never delete. To retire rows, set `record_status='archived'`
  (SQL) — they immediately drop out of public view via RLS.
- **Stale-data handling:** `source_last_updated_at` is stamped on import and shown on the
  property page as "Last updated"; the About-Data page states records may change and auctions
  can be postponed/cancelled.

## Restricted-data guarantees

- The `propertyradar` adapter is hard-coded `publicDisplayAllowed: false`; the import route
  forces its rows to `draft`. A unit test asserts this flag (`tests/adapters.test.ts`).
- Publishing restricted rows would require **both** flipping the adapter flag **and** an
  administrator explicitly changing `record_status` — a deliberate two-step, not an accident
  of import.
- Property pages link out to the official `source_url` (permitted outbound/affiliate link)
  rather than reproducing restricted fields.

## What must happen before publishing restricted data

1. A confirmed **public-display / redistribution license** for the specific source
   (business/legal decision — **not** present in this repo).
2. Set the adapter's `publicDisplayAllowed: true` **only** for the licensed source.
3. Only then may an administrator publish those rows.

Until then, questionable sources remain **draft / private / unpublished**. This audit does
not assert any license exists.

## No fabricated data

There is no seed data and no mock listings in the app. With an empty/unconfigured database,
search and opportunity sections render clean empty states. Verified: `grep` finds no seeded
property fixtures in the app runtime; the only property fixtures are in `tests/` (fictional,
used by unit tests, never served).
