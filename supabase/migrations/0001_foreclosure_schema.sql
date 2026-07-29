-- Private Note Capital — Foreclosure & Auction Intelligence platform
-- Migration 0001: core schema.
--
-- The pre-foreclosure investor app had NO database; these are all new tables and
-- do not conflict with any existing name. Property data is kept entirely separate
-- from any lead/contact structure (there is no shared "leads" table here — lead
-- activity lives in property_interests / search_alerts).
--
-- Conventions: uuid pks, timestamptz, updated_at maintained by trigger.

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums (guarded so re-runs don't error)
-- ---------------------------------------------------------------------------
do $$ begin
  create type foreclosure_stage as enum (
    'pre_foreclosure',      -- NOD / lis pendens filed
    'notice_of_default',
    'notice_of_sale',       -- NOS / auction scheduled
    'auction',              -- scheduled/active auction
    'postponed',
    'cancelled',
    'sold_third_party',
    'reo_bank_owned'        -- returned to lender / bank-owned
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_type as enum (
    'single_family',
    'condo',
    'townhouse',
    'multifamily_2_4',
    'multifamily_5plus',
    'commercial',
    'land',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type record_status as enum ('draft', 'published', 'archived', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type occupancy_status as enum ('owner_occupied', 'tenant_occupied', 'vacant', 'unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type auction_event_type as enum (
    'new_filing',
    'auction_scheduled',
    'auction_postponed',
    'opening_bid_changed',
    'auction_cancelled',
    'sold_to_third_party',
    'returned_to_lender',
    'bank_owned'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type interest_action as enum (
    'save',
    'track_auction',
    'deal_review',
    'financing_request',
    'watchlist'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type financing_type as enum (
    'auction_acquisition',
    'bridge',
    'fix_and_flip',
    'rehabilitation',
    'dscr_takeout',
    'private_capital'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- foreclosure_properties — the catalog. Only rows we have the right to display.
-- ---------------------------------------------------------------------------
create table if not exists foreclosure_properties (
  id                    uuid primary key default gen_random_uuid(),
  external_id           text not null,                    -- id in the source system
  source_name           text not null,                    -- e.g. 'propertyradar', 'broward_clerk', 'manual_csv'
  source_url            text,                              -- official/source record link
  state                 text not null check (state in ('CA','FL')),
  county                text,
  city                  text,
  zip                   text,
  address               text,
  apn                   text,                              -- parcel number
  property_type         property_type,
  beds                  numeric(4,1),
  baths                 numeric(4,1),
  units                 integer,
  square_feet           integer,
  foreclosure_stage     foreclosure_stage,
  original_auction_date date,
  current_auction_date  date,
  opening_bid           numeric(14,2),
  estimated_value       numeric(14,2),
  estimated_debt        numeric(14,2),
  estimated_equity      numeric(14,2),                     -- may be source-provided or derived; see generated note below
  occupancy_status      occupancy_status default 'unknown',
  previous_sale_date    date,
  previous_sale_price   numeric(14,2),
  record_status         record_status not null default 'draft',
  source_last_updated_at timestamptz,                      -- "Last updated" shown on the property page
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- One row per (source, external id): the upsert key that prevents duplicates.
  constraint foreclosure_properties_source_external_uniq unique (source_name, external_id)
);

create index if not exists idx_fp_state_county on foreclosure_properties (state, county);
create index if not exists idx_fp_city on foreclosure_properties (city);
create index if not exists idx_fp_zip on foreclosure_properties (zip);
create index if not exists idx_fp_stage on foreclosure_properties (foreclosure_stage);
create index if not exists idx_fp_auction_date on foreclosure_properties (current_auction_date);
create index if not exists idx_fp_status on foreclosure_properties (record_status);
create index if not exists idx_fp_type on foreclosure_properties (property_type);
create index if not exists idx_fp_opening_bid on foreclosure_properties (opening_bid);
create index if not exists idx_fp_est_value on foreclosure_properties (estimated_value);
create index if not exists idx_fp_est_equity on foreclosure_properties (estimated_equity);
-- "New this week" / recency ordering.
create index if not exists idx_fp_created_at on foreclosure_properties (created_at desc);

drop trigger if exists trg_fp_updated_at on foreclosure_properties;
create trigger trg_fp_updated_at before update on foreclosure_properties
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- auction_events — immutable-ish change log per property (postponements, bid changes…)
-- ---------------------------------------------------------------------------
create table if not exists auction_events (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references foreclosure_properties(id) on delete cascade,
  event_type     auction_event_type not null,
  event_date     date,
  previous_value text,
  new_value      text,
  source_name    text,
  source_url     text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_ae_property on auction_events (property_id, created_at desc);
create index if not exists idx_ae_type on auction_events (event_type);

-- ---------------------------------------------------------------------------
-- saved_properties — a signed-in user's saved list (RLS: owner only).
-- ---------------------------------------------------------------------------
create table if not exists saved_properties (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  property_id   uuid not null references foreclosure_properties(id) on delete cascade,
  alert_enabled boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint saved_properties_user_property_uniq unique (user_id, property_id)
);
create index if not exists idx_sp_user on saved_properties (user_id);
drop trigger if exists trg_sp_updated_at on saved_properties;
create trigger trg_sp_updated_at before update on saved_properties
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- search_alerts — weekly watchlist subscriptions (explicit opt-in only).
-- ---------------------------------------------------------------------------
create table if not exists search_alerts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users(id) on delete cascade,  -- nullable: pre-account opt-in
  email                text not null,
  first_name           text,
  last_name            text,
  phone                text,
  state                text check (state in ('CA','FL')),
  counties             text[] not null default '{}',
  property_types       text[] not null default '{}',
  minimum_price        numeric(14,2),
  maximum_price        numeric(14,2),
  auction_date_horizon text,                              -- e.g. '30d','60d','90d'
  financing_type       financing_type,
  investor_experience  text,
  frequency            text not null default 'weekly',
  consented_at         timestamptz,                        -- watchlist not sent until this is set
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_sa_user on search_alerts (user_id);
create index if not exists idx_sa_email on search_alerts (email);
create index if not exists idx_sa_active on search_alerts (active);
drop trigger if exists trg_sa_updated_at on search_alerts;
create trigger trg_sa_updated_at before update on search_alerts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- property_interests — every lead action (save/track/review/financing/watchlist)
-- with attribution. Written server-side; forwarded to GRCRM.
-- ---------------------------------------------------------------------------
create table if not exists property_interests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,   -- nullable: anonymous leads allowed
  property_id      uuid references foreclosure_properties(id) on delete set null,
  action_type      interest_action not null,
  financing_type   financing_type,
  requested_amount numeric(14,2),
  first_name       text,
  last_name        text,
  email            text,
  phone            text,
  state            text,
  county           text,
  investor_experience text,
  notes            text,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  referrer         text,
  consent_at       timestamptz,
  crm_forwarded    boolean not null default false,        -- did the GRCRM POST succeed?
  crm_error        text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_pi_user on property_interests (user_id);
create index if not exists idx_pi_property on property_interests (property_id);
create index if not exists idx_pi_action on property_interests (action_type);
create index if not exists idx_pi_created on property_interests (created_at desc);

-- ---------------------------------------------------------------------------
-- import_jobs — audit trail for every CSV/JSON import run.
-- ---------------------------------------------------------------------------
create table if not exists import_jobs (
  id               uuid primary key default gen_random_uuid(),
  source_name      text not null,
  filename         text,
  records_received integer not null default 0,
  records_created  integer not null default 0,
  records_updated  integer not null default 0,
  records_rejected integer not null default 0,
  error_log        jsonb not null default '[]'::jsonb,    -- [{row, reason}]
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);
create index if not exists idx_ij_source on import_jobs (source_name);
create index if not exists idx_ij_created on import_jobs (created_at desc);

-- ---------------------------------------------------------------------------
-- admin_users — membership gate for /admin. Server checks this with the
-- service role; there is no client-writable admin flag.
-- ---------------------------------------------------------------------------
create table if not exists admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);
