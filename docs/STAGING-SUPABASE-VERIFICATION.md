# Staging Supabase verification

**Do not apply to production.** Apply to a **staging** project only, then run the
checks below. No real credentials appear in this doc.

## Migration order

1. `supabase/migrations/0001_foreclosure_schema.sql` — enums, 7 tables, indexes, `updated_at` triggers
2. `supabase/migrations/0002_rls_policies.sql` — enable RLS + policies
3. `supabase/migrations/0003_lead_delivery_state.sql` — `property_interests.event_id` + `delivery_state`

## Expected objects

- **Tables:** `foreclosure_properties`, `auction_events`, `saved_properties`,
  `search_alerts`, `property_interests`, `import_jobs`, `admin_users`.
- **Enums:** `foreclosure_stage`, `property_type`, `record_status`,
  `occupancy_status`, `auction_event_type`, `interest_action`, `financing_type`.
- **Indexes:** state/county, city, zip, stage, auction date, status, type,
  opening_bid, est_value, est_equity, created_at (properties); event_id,
  delivery_state, property, action (interests); plus per-table FKs.
- **FKs:** auction_events→properties; saved/search/interests→auth.users;
  interests→properties; import_jobs.created_by→auth.users; admin_users→auth.users.
- **Triggers:** `set_updated_at()` on properties/saved/search.
- **Functions:** `set_updated_at()`.
- **Auth:** email/password provider enabled; site URL in the redirect allow-list.
- **Admin model:** membership rows in `admin_users` (service-role/SQL only).

## Verification SQL (run in the staging SQL editor)

### Migration state / RLS enabled
```sql
select relname, relrowsecurity from pg_class
where relname in ('foreclosure_properties','auction_events','saved_properties',
 'search_alerts','property_interests','import_jobs','admin_users');  -- all true
select column_name from information_schema.columns
where table_name='property_interests' and column_name in ('event_id','delivery_state'); -- both present
```

### Policy inventory
```sql
select tablename, policyname, cmd, qual, with_check
from pg_policies where schemaname='public' order by tablename, cmd;
```

### Anonymous denial (published-only reads; no writes)
```sql
set local role anon;
select count(*) from foreclosure_properties where record_status <> 'published';  -- 0
insert into foreclosure_properties(external_id,source_name,state,address,record_status)
  values('t','manual_csv','CA','1 A St','draft');                                -- FAILS (no insert policy)
select count(*) from property_interests;                                          -- 0 (private)
select count(*) from import_jobs;                                                 -- 0
reset role;
```

### Unpublished property invisibility
```sql
-- Insert a draft as service role, then confirm anon cannot see it.
insert into foreclosure_properties(external_id,source_name,state,address,record_status)
  values('draft-1','manual_csv','CA','9 Draft St','draft');
set local role anon;
select count(*) from foreclosure_properties where external_id='draft-1';          -- 0
reset role;
```

### Cross-user denial (saved + watchlist ownership)
```sql
-- With two auth users U1, U2 and a saved row owned by U1:
select set_config('request.jwt.claims',
  json_build_object('sub','<U2-uuid>','role','authenticated')::text, true);
select count(*) from saved_properties where user_id='<U1-uuid>';                  -- 0
update search_alerts set active=false where user_id='<U1-uuid>';                  -- 0 rows
```

### Financing-request confidentiality
```sql
select set_config('request.jwt.claims',
  json_build_object('sub','<some-user>','role','authenticated')::text, true);
select count(*) from property_interests where user_id <> '<some-user>';           -- 0
```

### Admin import permission
```sql
-- Non-admin cannot read import history:
select set_config('request.jwt.claims',
  json_build_object('sub','<non-admin>','role','authenticated')::text, true);
select count(*) from import_jobs;                                                  -- 0
-- Non-admin cannot self-grant admin:
insert into admin_users(user_id) values('<non-admin>');                           -- FAILS
```

### Service-role-only operations
```sql
-- As the service role (SQL editor default), writes succeed:
insert into foreclosure_properties(external_id,source_name,state,address,record_status)
  values('svc-1','manual_csv','CA','1 Svc St','published');                       -- OK
insert into import_jobs(source_name) values('manual_csv');                        -- OK
```

## Rollback (staging)

Additive migrations; to reverse in staging: `drop table <7 tables> cascade;` and
`drop type <7 enums>;`, or restore a pre-migration snapshot. No pre-existing
objects are altered. Bad data can be hidden without dropping tables:
`update foreclosure_properties set record_status='archived' where …;`.
