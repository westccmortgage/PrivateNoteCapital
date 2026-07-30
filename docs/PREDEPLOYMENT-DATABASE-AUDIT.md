# Pre-deployment database & RLS audit

**Scope:** static review of `supabase/migrations/*` on the audit branch. **No migrations
were applied.** These are unapplied SQL files; the queries below are for an administrator to
run **after** applying them to a staging project.

## Migrations

| File | Purpose |
|---|---|
| `0001_foreclosure_schema.sql` | Enums, tables, indexes, `updated_at` triggers |
| `0002_rls_policies.sql` | `enable row level security` + policies on all 7 tables |

## Tables (7) + key columns

| Table | Purpose | Sensitive? | Write path |
|---|---|---|---|
| `foreclosure_properties` | Property catalog | Public **only when** `record_status='published'` | Service role (import) |
| `auction_events` | Per-property change log | Public only if parent published | Service role |
| `saved_properties` | User's saved list | Private (per user) | User (RLS owner) |
| `search_alerts` | Watchlist subscriptions | Private (PII: email/phone) | Server insert; user manages own |
| `property_interests` | Lead activity | Private (PII) | Service role only |
| `import_jobs` | Import audit | Admin-only read | Service role |
| `admin_users` | Admin membership | Self-read only | Service role (manual) |

Upsert key preventing duplicates: `unique (source_name, external_id)` on
`foreclosure_properties`. `saved_properties` has `unique (user_id, property_id)`.

## RLS posture (verified in SQL, not applied)

- RLS **enabled** on all 7 tables.
- `foreclosure_properties`: **SELECT** policy `record_status = 'published'` only. **No
  INSERT/UPDATE/DELETE policy** → anon/authenticated clients cannot write (only the
  service role, which bypasses RLS).
- `auction_events`: SELECT gated on parent being published. No client writes.
- `saved_properties`: SELECT/INSERT/UPDATE/DELETE all gated on `auth.uid() = user_id`.
- `search_alerts`: SELECT/UPDATE/DELETE gated on `auth.uid() = user_id`. **No INSERT
  policy** → inserts happen server-side (service role) to support pre-account opt-in with
  attribution.
- `property_interests`: SELECT own only (`auth.uid() = user_id`). **No write policy** →
  server-only writes. Anonymous leads have `user_id = null` and are therefore not readable
  by any client.
- `import_jobs`: SELECT restricted to `admin_users` membership. No client writes.
- `admin_users`: SELECT own row only. No client writes (membership set via service role).

**Service-role key stays server-side** (`lib/env.server.ts` → `getAdminSupabase()`), never
imported by client code (verified: no secret env names in the client bundle).

## Verification queries (run in staging AFTER applying migrations)

### 1. RLS is enabled on every table
```sql
select relname, relrowsecurity
from pg_class
where relname in ('foreclosure_properties','auction_events','saved_properties',
                  'search_alerts','property_interests','import_jobs','admin_users');
-- Expect relrowsecurity = true for all rows.
```

### 2. List policies
```sql
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;
```

### 3. Anonymous cannot read unpublished properties
```sql
-- As the anon role (Supabase SQL editor: set role anon; or use the anon API key):
set local role anon;
insert into foreclosure_properties (external_id, source_name, state, address, record_status)
  values ('t1','manual_csv','CA','1 Test St','draft');  -- should FAIL (no insert policy)
select count(*) from foreclosure_properties where record_status <> 'published'; -- expect 0 rows visible
reset role;
```

### 4. One user cannot read another user's saved properties
```sql
-- Given two auth users U1, U2 and a saved row owned by U1:
-- Simulate U2 via PostgREST with U2's JWT, or:
select set_config('request.jwt.claims', json_build_object('sub','<U2-uuid>','role','authenticated')::text, true);
select count(*) from saved_properties where user_id = '<U1-uuid>'; -- expect 0
```

### 5. One user cannot alter another user's watchlist
```sql
select set_config('request.jwt.claims', json_build_object('sub','<U2-uuid>','role','authenticated')::text, true);
update search_alerts set active = false where user_id = '<U1-uuid>'; -- expect 0 rows affected
```

### 6. Financing requests / interests are not publicly readable
```sql
set local role anon;
select count(*) from property_interests; -- expect 0
reset role;
```

### 7. Import audit is admin-only
```sql
select set_config('request.jwt.claims', json_build_object('sub','<non-admin-uuid>','role','authenticated')::text, true);
select count(*) from import_jobs; -- expect 0 for a non-admin
```

### 8. Admin membership is not self-grantable
```sql
select set_config('request.jwt.claims', json_build_object('sub','<user-uuid>','role','authenticated')::text, true);
insert into admin_users (user_id) values ('<user-uuid>'); -- should FAIL (no insert policy)
```

## Storage

No Supabase Storage buckets are required by this platform (no user file uploads to storage;
the CSV import is processed in-memory server-side and not persisted as a file). The preserved
debt app's private bucket is unrelated and on a different branch.

## Rollback feasibility

Migrations are additive (new tables/enums/policies). To reverse in staging:
`drop table ... cascade` for the 7 tables + `drop type` for the enums, or restore from a
pre-migration snapshot. No pre-existing tables are altered. See `docs/rollback.md` scenario D
for hiding bad data without dropping tables.

## Findings

- ✅ RLS model is sound: default-deny writes, published-only public reads, owner-scoped
  private data, admin-gated audit, self-read admin membership.
- ⚠️ RLS depends on the migrations actually being applied. **Not verified against a live DB**
  in this audit (per instructions). Run queries 1–8 in staging before go-live.
- ⚠️ `admin_users` rows must be inserted via the service role / SQL only (there is
  intentionally no client insert path). Document who holds that access.
