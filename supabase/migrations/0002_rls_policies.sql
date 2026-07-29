-- Migration 0002: Row-Level Security.
--
-- Security model:
--   * Public (anon) + signed-in users may READ only PUBLISHED property data.
--   * Property/auction/import writes happen ONLY through the service role
--     (server-side import + admin routes). No client insert/update/delete.
--   * A user may read/write ONLY their own saved_properties and search_alerts.
--   * property_interests are written server-side (service role) after validation
--     and CRM forwarding; a signed-in user may READ their own.
--   * The service role bypasses RLS entirely, so server routes using the
--     service-role key are unaffected by these policies.

alter table foreclosure_properties enable row level security;
alter table auction_events         enable row level security;
alter table saved_properties       enable row level security;
alter table search_alerts          enable row level security;
alter table property_interests     enable row level security;
alter table import_jobs            enable row level security;
alter table admin_users            enable row level security;

-- ---- foreclosure_properties: public read of published rows only ----
drop policy if exists fp_read_published on foreclosure_properties;
create policy fp_read_published on foreclosure_properties
  for select using (record_status = 'published');

-- ---- auction_events: readable when the parent property is published ----
drop policy if exists ae_read_published on auction_events;
create policy ae_read_published on auction_events
  for select using (
    exists (
      select 1 from foreclosure_properties fp
      where fp.id = auction_events.property_id
        and fp.record_status = 'published'
    )
  );

-- ---- saved_properties: owner-only CRUD ----
drop policy if exists sp_select_own on saved_properties;
create policy sp_select_own on saved_properties
  for select using (auth.uid() = user_id);
drop policy if exists sp_insert_own on saved_properties;
create policy sp_insert_own on saved_properties
  for insert with check (auth.uid() = user_id);
drop policy if exists sp_update_own on saved_properties;
create policy sp_update_own on saved_properties
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists sp_delete_own on saved_properties;
create policy sp_delete_own on saved_properties
  for delete using (auth.uid() = user_id);

-- ---- search_alerts: owner-only read/update/delete (inserts go server-side to
--      support pre-account opt-in with attribution; signed-in users may also
--      manage their linked alerts) ----
drop policy if exists sa_select_own on search_alerts;
create policy sa_select_own on search_alerts
  for select using (auth.uid() = user_id);
drop policy if exists sa_update_own on search_alerts;
create policy sa_update_own on search_alerts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists sa_delete_own on search_alerts;
create policy sa_delete_own on search_alerts
  for delete using (auth.uid() = user_id);

-- ---- property_interests: owner may read own; NO client writes (server only) ----
drop policy if exists pi_select_own on property_interests;
create policy pi_select_own on property_interests
  for select using (auth.uid() = user_id);

-- ---- import_jobs: admins may read; NO client writes ----
drop policy if exists ij_select_admin on import_jobs;
create policy ij_select_admin on import_jobs
  for select using (exists (select 1 from admin_users a where a.user_id = auth.uid()));

-- ---- admin_users: a user may read only their own membership row ----
drop policy if exists au_select_self on admin_users;
create policy au_select_self on admin_users
  for select using (auth.uid() = user_id);

-- Note: no INSERT/UPDATE/DELETE policies are defined for foreclosure_properties,
-- auction_events, property_interests, import_jobs, or admin_users. With RLS
-- enabled and no permissive write policy, anon/authenticated clients cannot
-- write them. The service role (server-side only) bypasses RLS and performs
-- all imports, interest logging, and admin management.
