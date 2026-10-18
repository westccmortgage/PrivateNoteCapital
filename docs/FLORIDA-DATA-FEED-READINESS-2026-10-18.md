# Florida foreclosure inventory onboarding — October 18, 2026

## What is live and verified

- Public Florida county auction research hub: `/florida/foreclosure-auctions`, six official county Clerk resources; **not** a claim that individual case rows are present.
- Private Note Capital → GRCRM: one synthetic contact submission delivered, with local Supabase row `delivery_state=delivered` and matching GRCRM source log. GitHub Actions run 39164650968 succeeded.
- GRCRM token is now sent via secret `X-Lead-Token` header, never in the URL; the old query-token lead source was disabled after v2 delivery passed.
- The internal GRCRM database also contains 1,030 California PropertyRadar-derived records, 498 flagged foreclosure; these remain internal. No California PropertyRadar records are released publicly.

## Current inventory gap

Production `foreclosure_properties` and `auction_events` have zero records as of October 18. The county Clerk public calendars are live *external websites*, not an approved machine-readable ongoing subscription. An official Clerk or commercial data service's offer of court filing data is **not** proof that it supplies current upcoming foreclosure sale dates.

## Sources and onboarding requirements

| County | Official source | What is verified | Required before importing individual sales |
|---|---|---|---|
| Palm Beach | https://www.mypalmbeachclerk.com/departments/courts/foreclosures | Clerk points to auction calendar for upcoming sales. ClerkCart sells new foreclosure *filing* reports separately. | Request an authorized sale-event CSV/API or permitted export including current sale statuses; confirm public republication and refresh terms. |
| Broward | https://www.browardclerk.org/web2/services/aboutapi | Clerk Commercial Data Access API for high-volume court records; notarized agreement and paid subscription. | Confirm whether it actually provides auction-sale events, not only case dockets, and obtain pricing, credentials, permitted fields and website display rights. |
| Miami-Dade | https://www.miamidadeclerk.gov/clerk/commercial-data-services.page | Court bulk folders priced $110 per folder per month (exceptions apply), API $0.20 per unit/request. | Confirm an available *upcoming auction sales* feed, intended folder/API, reuse license, and pay/register only after authorization. |
| Hillsborough, Orange, Duval | See official county pages in `lib/florida-auctions.ts`. | County Clerk auction pages exist and are linked from Florida hub. | Separately qualify machine-readable event data and redistribution terms per county. |

**Prepared but not sent** email inquiries from westccmortgage@gmail.com:
- Palm Beach: foreclosuresclerkweb@mypalmbeachclerk.com
- Broward: PublicAccessHelpDesk@browardclerk.org
- Miami-Dade: clerksoffice@miamidade.gov

## Safe launch procedure after obtaining an authorized source

1. Obtain explicit right to download, store and **display** the requested fields publicly (source terms, attribution, refresh cadence, PII restrictions). Preserve agreement with project records.
2. Obtain current upcoming foreclosure SALES cases with external record ID, case #, parcel/APN or address, state/county, official source URL, auction date and live lifecycle status (scheduled/postponed/cancelled/sold). Do **not** substitute filings for sale events. Validate timestamps and timezone.
3. Configure a source-specific feed under server-only Netlify secrets (for Palm Beach: `PBC_AUCTION_REPORT_URL` and source type/token). Do not set any public-display approval flag until verified; imported unknown sources must stay `draft`.
4. Or for an approved CSV, use admin-only `/admin/import` and choose the appropriate Florida Clerk adapter; preview and validate field mapping and licensing. All import profiles default to **draft-only** until written review changes that particular source profile.
5. Test in staging using actual but permitted records, reconcile them against the Clerk's official sale calendar, archive cancelled/withdrawn/outdated records and ensure owner data and restricted fields are excluded.
6. Review with legal/compliance counsel where needed; enable `publicDisplayAllowed` only on the approved adapter, deploy, confirm individual source URL and refreshed timestamp, and monitor stale records daily. Preserve records as draft if current data or rights cannot be verified.

## GRCRM operational verification and security

- Netlify site `sparkly-sunburst-44d0f4` has server-side `GRCRM_LEAD_WEBHOOK_URL` (without credentials), separate secret `GRCRM_LEAD_WEBHOOK_TOKEN`, and a secured daily sync shared secret.
- Source `Private Note Capital — website` in GRCRM is active for v2 token; legacy query-token source inactive.
- Receivers can take ~10s due to synchronous notification work; site timeout is 20s.
- Test QA status: HTTP 200, `forwarded:true`; local `property_interests` persisted `delivered`; corresponding CRM `lead_inbound_log` created.
- QA contacts are not customers. Mark/remove test records under established retention policy; do not include them in campaigns.

## Data rights and safety notes

A source being a public court webpage does NOT automatically authorize aggressive scraping, redistribution, or paid commercial resale. Distinguish sourced foreclosure cases and confirmed scheduled sale events. Never fabricate price, market value, debt balance, equity or auction availability. PropertyRadar California licensing and publication authorization remain separate workstreams.
