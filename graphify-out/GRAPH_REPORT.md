# Graph Report - private-note-capital  (2026-11-12)

## Corpus Check
- 150 files · ~71,092 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 861 nodes · 1811 edges · 53 communities (48 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]

## God Nodes (most connected - your core abstractions)
1. `Shell()` - 23 edges
2. `Card()` - 22 edges
3. `Private Note Capital — pre-deployment report` - 21 edges
4. `getServerSupabase()` - 20 edges
5. `Private Note Capital — security remediation report` - 20 edges
6. `FetchLike` - 19 edges
7. `getAdminSupabase()` - 18 edges
8. `getCurrentUser()` - 18 edges
9. `Button()` - 17 edges
10. `recordInterest()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getCountyStatuses()`  [INFERRED]
  app/api/admin/data-sync/route.ts → lib/providers/status.ts
- `POST()` --calls--> `getProvider()`  [INFERRED]
  app/api/admin/data-sync/route.ts → lib/providers/registry.ts
- `POST()` --calls--> `runCountySync()`  [INFERRED]
  app/api/admin/data-sync/route.ts → lib/providers/sync.ts
- `DataSyncPage()` --calls--> `getAdminSupabase()`  [EXTRACTED]
  app/admin/data-sync/page.tsx → lib/supabase/server.ts
- `AdminImportPage()` --calls--> `getAdminSupabase()`  [EXTRACTED]
  app/admin/import/page.tsx → lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (53 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (55): ImportWizard(), AdminLayout(), GET(), POST(), CalendarPage(), Attribution, POST(), InterestAttribution (+47 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (53): CommitResult, FL_ADAPTERS, PreviewRow, RejectedRow, ValidateResult, POST(), ADAPTERS, CANONICAL (+45 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (33): ConnResult, DataSyncPanel(), GET(), POST(), DataSyncPage(), metadata, authorized(), handle() (+25 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (30): HomePage(), metadata, Badge(), fetchProperty(), PropertyPage(), sourceLabel(), publicEnv, serverEnv (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (33): dependencies, framer-motion, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+25 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (24): FinancingPage(), labelFor(), ACTION_LABEL, buildGrcrmPayload(), buildMessage(), classifyError(), classifyStatus(), CrmLead (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (15): FINANCING_BLURB, BTN_SIZE, BTN_VARIANT, ButtonProps, H2(), Kicker(), Section(), checks (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (17): GET(), PasswordInput(), AuthForm(), Mode, buildResetRedirect(), NewPasswordResult, passwordInputType(), recoveryPageState() (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (18): EmptyState(), PROPERTY_CLASS, classesToTypes(), first(), num(), parseSearchParams(), RawParams, runSearch() (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (17): metadata, FinancingForm(), FinancingInitial, WatchlistForm(), AUCTION_HORIZONS, COLLECTOR_SOURCES, COUNTIES, FINANCING_TYPES (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (10): NotFound(), CompanyPage(), metadata, Shell(), ContactPage(), metadata, COMPANY, telHref() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (13): Card(), metadata, clamp(), FORBIDDEN_RETURN_TERMS, Guideline, illustrateYield(), ILLUSTRATOR_BOUNDS, PARTNER_DELIVERABLES (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (21): 10. GRCRM verification status, 11. Property-data licensing controls, 12. Test commands & totals, 13. Production build, 14. Mobile / accessibility, 15. Required Netlify sites & settings, 16. Required Supabase configuration, 17. Required environment variables (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (20): 10. Sender/receiver mapping (reconciled), 11. Delivery durability status, 12. Supabase staging readiness, 13. Property publication tests, 14. Exact files changed (vs `c61a7ac`), 15. Test commands & totals, 16. Build result, 17. Mobile / regression (+12 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (13): WritableProperty, eventKeyFor(), stageAndLifecycle(), toNormalizedEvent(), field(), HTTPS_FORMATS, laEventType(), mapUseType() (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (8): cache, CacheEntry, clearHttpCache(), FetchOptions, realFetch(), FetchLikeResponse, provider, provider

### Community 16 - "Community 16"
Cohesion: 0.21
Nodes (10): cached(), numAttr(), PalmBeachForeclosureProvider, parseCsvRecords(), parseJsonRecords(), strAttr(), reconcileMissing(), DiscoverOptions (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (10): metadata, serif, viewport, ROUTES, SITE, FOOTER_LINKS, SiteFooter(), MOBILE_EXTRA (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (16): 1. RLS is enabled on every table, 2. List policies, 3. Anonymous cannot read unpublished properties, 4. One user cannot read another user's saved properties, 5. One user cannot alter another user's watchlist, 6. Financing requests / interests are not publicly readable, 7. Import audit is admin-only, 8. Admin membership is not self-grantable (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (15): 10. Redirects, security rules, 11. Discrepancies between README and actual code (documented, not corrected), 12. Current production domain configuration, 1. Framework & stack, 2. Build commands, 3. Production branch & hosting, 4. Netlify configuration (`netlify.toml`), 5. Routes (App Router) (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (8): Lifecycle, EventPropertyInput, permissionFor(), publicDisplayAllowed(), DiscoverResult, ParcelEnrichment, PublicationPermission, SourceMeta

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (13): Admin import permission, Anonymous denial (published-only reads; no writes), Cross-user denial (saved + watchlist ownership), Expected objects, Financing-request confidentiality, Migration order, Migration state / RLS enabled, Policy inventory (+5 more)

### Community 23 - "Community 23"
Cohesion: 0.21
Nodes (8): Field(), SimpleInquiryForm(), Attribution, readAttribution(), CAPITAL_RANGES, LIEN_PREF, TIMELINES, metadata

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (10): Adding a source, Admin wizard — `/admin/import`, CSV format, Data import guide, Florida counties (Phase 1), Import pipeline, Load real inventory NOW (owner quick-start), Principles (data-source rules) (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (10): arcgisEscape(), ArcgisFeature, ArcgisQuery, ArcgisResult, buildQueryUrl(), pingService(), queryAll(), queryFeatures() (+2 more)

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (4): FeedFormat, LAAssessorEnrichmentProvider, LAEventFeedProvider, ConnectionResult

### Community 27 - "Community 27"
Cohesion: 0.42
Nodes (9): decodeXml(), isObj(), parseCsvFeed(), parseFeed(), parseJsonFeed(), parseXmlFeed(), parseZipFeed(), unzipEntries() (+1 more)

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (8): Architecture, Compliance model, County foreclosure collectors — Palm Beach + Los Angeles, Los Angeles County (CA) — two independent pieces, Migration, Owner configuration (Netlify env, server-side only), Palm Beach County (FL) — primary live collector, Scheduled sync

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (8): Data model, Foreclosure & Auction Intelligence — architecture, Graceful degradation, Overview, Production hardening notes, Routes, Security model, Traffic entry & attribution

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (8): Content roadmap (specific search intent), Current evidence / uncertainty, First delivery sequence, Launch gates — required before paid acquisition, Lead lifecycle and measurement, Mission & distinct positioning, Private Note Capital — Growth Launch Plan, Suggested homepage architecture

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (8): Data safety, Restore points, Rollback, Scenario A — revert the apex to the pre-foreclosure investor site, Scenario B — take down the debt subdomain, Scenario C — roll back a bad foreclosure deploy (keep the platform), Scenario D — undo a bad data import, What was NOT changed (per instructions)

### Community 32 - "Community 32"
Cohesion: 0.22
Nodes (8): Database, Develop, Documentation, GRCRM integrations, One GRCRM lead intake route, Private Note Capital — one combined platform, Routes, Stack

### Community 33 - "Community 33"
Cohesion: 0.21
Nodes (4): metadata, POINTS, FAQ, metadata

### Community 34 - "Community 34"
Cohesion: 0.32
Nodes (4): Button(), metadata, FLORIDA_AUCTION_SOURCES, FloridaCountyAuctionSource

### Community 35 - "Community 35"
Cohesion: 0.25
Nodes (7): California investor listings — separate product & source controls, Data-handling boundaries, Florida isolation guard, Operating validation, PropertyRadar agreement, Public implementation, User-approved product distinction

### Community 36 - "Community 36"
Cohesion: 0.25
Nodes (7): Auth URL configuration (required for password reset), Deploy, Deployment — one site, Environment (Netlify → site settings), Rollback, Smoke test, Supabase

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (7): Current inventory gap, Data rights and safety notes, Florida foreclosure inventory onboarding — October 18, 2026, GRCRM operational verification and security, Safe launch procedure after obtaining an authorized source, Sources and onboarding requirements, What is live and verified

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (7): Field mapping table (sender → verified receiver), GRCRM contract mapping (verified), Idempotency & duplicates, Per-flow, To enable structured mapping (future, GRCRM-side change — out of scope here), Verified receiver, What this means for Private Note Capital

### Community 39 - "Community 39"
Cohesion: 0.25
Nodes (7): Blocker, GRCRM integration, Integration pattern (reuses the existing approved path), Payload → CRM mapping, Security model, Tables, functions, security actually used, When leads are sent

### Community 40 - "Community 40"
Cohesion: 0.25
Nodes (7): Concrete test payload (fictional — do NOT send to production), GRCRM integration verification, Property data is never placed in the contact/lead name (verified), Receiving contract — verification status, Recommendations (blockers/hardening), Transport & security (verified), When leads fire

### Community 41 - "Community 41"
Cohesion: 0.25
Nodes (7): Blocker summary, PropertyRadar / ForeclosureRadar integration, What data is permitted to appear publicly today, What is implemented today, What requires a public-display / redistribution license, What requires partner approval, Where credentials would be configured

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (6): Consolidation report — one application, Gate, One of everything, Removed / obsolete, Security preserved (no regression), What was combined

### Community 43 - "Community 43"
Cohesion: 0.29
Nodes (6): Behavior per GRCRM condition, Delivery states, Duplicate / retry safety, GRCRM delivery failure model, Limitation (honest), Pipeline (`lib/lead.ts` → `lib/crm.ts`)

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (6): Before, Breaking changes handled (Next 14 → 15), Dependency audit resolution, Next.js security upgrade, Selected target: **Next 15.5.22** (keep React 18.3.1), Verification after upgrade

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (6): No fabricated data, Property data publication controls, Restricted-data guarantees, Source-by-source (from `lib/adapters.ts`), The core control, What must happen before publishing restricted data

### Community 46 - "Community 46"
Cohesion: 0.40
Nodes (4): Environment / Supabase / gate / smoke / rollback, Framework compatibility, Netlify release runbook — one site, Single site

## Knowledge Gaps
- **348 isolated node(s):** `extends`, `metadata`, `POINTS`, `metadata`, `metadata` (+343 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Card()` connect `Community 11` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 34`, `Community 6`, `Community 7`, `Community 10`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `serverEnv` connect `Community 3` to `Community 0`, `Community 2`, `Community 5`, `Community 14`, `Community 16`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `Shell()` connect `Community 10` to `Community 0`, `Community 33`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 11`, `Community 23`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `extends`, `metadata`, `POINTS` to the rest of the system?**
  _348 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07668231611893583 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06993006993006994 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07676767676767676 - nodes in this community are weakly interconnected._