-- Migration 0004: richer foreclosure fields (OPTIONAL, additive).
--
-- These columns capture the long tail of real foreclosure exports. They are all
-- nullable and additive — nothing is dropped or altered. The importer writes them
-- ONLY when the columns exist (it filters its payload to the live table columns),
-- so imports keep working whether or not this migration has been applied. Apply
-- it to capture the extra fields; the core search works without it.

alter table foreclosure_properties
  add column if not exists latitude               numeric(9,6),
  add column if not exists longitude              numeric(9,6),
  add column if not exists year_built             integer,
  add column if not exists lot_size               numeric(14,2),
  add column if not exists trustee_name           text,
  add column if not exists case_number            text,
  add column if not exists notice_type            text,
  add column if not exists notice_recording_date  date,
  add column if not exists default_date           date,
  add column if not exists auction_time           text,
  add column if not exists auction_location       text,
  add column if not exists unpaid_balance         numeric(14,2),
  add column if not exists judgment_amount        numeric(14,2),
  add column if not exists assessed_value         numeric(14,2),
  add column if not exists estimated_lien_position text,
  add column if not exists source_license_status  text,
  -- last_seen_at: refreshed on every import that includes the record. Used to
  -- flag stale records not seen in a recent export. (updated_at also bumps via
  -- the 0001 trigger; last_seen_at is the explicit "seen in a source file" mark.)
  add column if not exists last_seen_at           timestamptz;

create index if not exists idx_fp_case_number on foreclosure_properties (case_number);
create index if not exists idx_fp_last_seen on foreclosure_properties (last_seen_at);
