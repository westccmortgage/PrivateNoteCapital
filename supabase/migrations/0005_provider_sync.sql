-- Migration 0005: automatic county collectors (Palm Beach + Los Angeles).
-- OPTIONAL + additive. Nothing is dropped or altered.
--
-- Two parts:
--   1. Provider-provenance columns on foreclosure_properties (nullable). The
--      collectors write these ONLY when the columns exist (column-aware upsert in
--      lib/import-writer), so the app works whether or not this migration is
--      applied — exactly like 0004.
--   2. Two small tables for sync bookkeeping: provider_sync_runs (per-run audit +
--      overlap lock) and provider_sync_state (resumable cursor/checkpoint).

-- 1) Provenance columns (Section 3: source authority/type/access + permission).
alter table foreclosure_properties
  add column if not exists source_authority        text,
  add column if not exists source_type             text,   -- clerk_auction_report | recorder_feed | arcgis_parcel …
  add column if not exists source_access_method    text,   -- https_json | https_csv | https_zip | arcgis_query …
  add column if not exists collected_at             timestamptz,
  add column if not exists publication_permission  text,   -- public_official | contract_authorized | review_required | restricted | unknown
  add column if not exists document_number         text;   -- LA recorder document number

create index if not exists idx_fp_publication_permission on foreclosure_properties (publication_permission);
create index if not exists idx_fp_document_number on foreclosure_properties (document_number);

-- 2a) Per-run audit + in-DB overlap lock.
create table if not exists provider_sync_runs (
  id             uuid primary key default gen_random_uuid(),
  provider       text not null,                 -- e.g. 'palm_beach_county', 'la_county_recorder'
  county         text not null,
  correlation_id text not null,
  status         text not null default 'running', -- running | completed | error
  triggered_by   text,                          -- 'cron' | 'admin' | 'manual' (never PII)
  received       integer not null default 0,
  created        integer not null default 0,
  updated        integer not null default 0,
  published      integer not null default 0,
  archived       integer not null default 0,
  rejected       integer not null default 0,
  detail         text,
  started_at     timestamptz not null default now(),
  finished_at    timestamptz
);
create index if not exists idx_psr_provider on provider_sync_runs (provider, started_at desc);
create index if not exists idx_psr_status on provider_sync_runs (status);

-- 2b) Resumable cursor / file checkpoint per provider.
create table if not exists provider_sync_state (
  provider        text primary key,
  cursor          text,        -- opaque high-water mark (e.g. last recording date / offset)
  last_file       text,        -- last feed filename processed
  last_success_at timestamptz,
  updated_at      timestamptz not null default now()
);

-- RLS: these are server-only (service role bypasses RLS). Enable RLS with NO
-- public policies so the anon/authenticated roles can never read sync internals.
alter table provider_sync_runs enable row level security;
alter table provider_sync_state enable row level security;
