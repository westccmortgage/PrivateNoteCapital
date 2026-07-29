# Rollback

## Restore points

| Marker | Where | Points at |
|---|---|---|
| `rollback/pre-foreclosure` (branch, on remote) | `origin/rollback/pre-foreclosure` | `1c5a37d` — exact pre-foreclosure production |
| `private-note-capital-pre-foreclosure` (tag, **local only**) | local repo | `1c5a37d` |
| `debt-platform` (branch, on remote) | `origin/debt-platform` | pre-foreclosure app + subdomain URL only |

> The annotated/lightweight tag could not be pushed through the session's git relay (it
> accepts branch refs but rejects tag refs). The identical commit is preserved as the branch
> `rollback/pre-foreclosure`. To publish the tag from a machine with direct git access:
> `git push origin private-note-capital-pre-foreclosure`

## Scenario A — revert the apex to the pre-foreclosure investor site

The pre-foreclosure code is intact at `1c5a37d`. Two options:

**A1 — repoint the Netlify production branch (fastest, no history change):**
Point the apex Netlify site's production branch to `rollback/pre-foreclosure` and redeploy.
The apex serves the old investor app again. `main` is untouched.

**A2 — reset `main` (rewrites `main`):**
```
git fetch origin
git checkout main
git reset --hard 1c5a37d          # or origin/rollback/pre-foreclosure
git push --force-with-lease origin main
```
Only do this if you truly want `main` itself to be the old app again. Prefer A1.

## Scenario B — take down the debt subdomain

The subdomain site is additive. Delete the Netlify Site 1 and remove the `debt` DNS record.
No effect on the apex. The `debt-platform` branch remains for a future redeploy.

## Scenario C — roll back a bad foreclosure deploy (keep the platform)

```
git revert <bad-commit>           # or reset to the last good commit
git push origin main
```
Netlify redeploys the previous good state. Because the app degrades gracefully when env is
unset, a partial backend outage does not require a code rollback.

## Scenario D — undo a bad data import

Imports never delete; they upsert by `(source_name, external_id)` and log to `import_jobs`.
To hide bad rows immediately:
```sql
update foreclosure_properties set record_status = 'archived'
where source_name = '<source>' and created_at >= '<import time>';
```
Restricted-source rows are already `draft` (never public), so a bad restricted import is not
publicly visible in the first place.

## Data safety

- No destructive schema changes to any pre-existing system (the old app had no DB).
- All new tables are additive. RLS prevents public/anon writes.
- The service-role key is server-only; a client compromise cannot escalate to writes.

## What was NOT changed (per instructions)

- **Pegasus Capital Network** — untouched and unreferenced anywhere in this project.
- **GRCRM** — not exposed publicly; integration reuses the existing approved webhook only.
