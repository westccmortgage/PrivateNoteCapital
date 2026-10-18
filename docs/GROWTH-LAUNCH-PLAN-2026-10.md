# Private Note Capital — Growth Launch Plan
**Owner:** West Coast Capital Mortgage Inc.  
**Baseline date:** 2026-10-18  
**Status:** Implementation checklist; items are NOT claimed live until individually verified.

## Mission & distinct positioning
PrivateNoteCapital.com is a two-sided opportunity and capital marketplace:
1. Sourced, current California/Florida foreclosure and auction intelligence for investors.
2. Real-estate-secured private-note capital partner inquiries and business-purpose acquisition financing.

Keep separate roles:
- **PrivateNoteCapital:** discovery, source attribution, auction watchlists, investor intake.
- **CADeed:** California borrower scenario analysis and private-capital loan intake.
- **Pegasus Capital Network:** capital-source and public lender network/discovery. Never imply investor listings or agreements without verification.
- **GRCRM:** centralized lead records, lifecycle, ownership, opt-in and suppression.

No fabricated assets, offers, yields, investor commitments, reviews, or lender partnerships.

## Launch gates — required before paid acquisition
| ID | Priority | Workstream | Verification / acceptance criterion |
|---|---|---|---|
| PNC-01 | P0 | Production infrastructure | Confirm Netlify production site, deploy SHA, domain, TLS and env presence (without logging secrets); record owner and rollback path. |
| PNC-02 | P0 | Supabase | Verify migrations 0001-0003, admin allowlist, RLS and storage/data-source inventory against production. Never import private data without usage rights. |
| PNC-03 | P0 | Lead delivery | Submit authorized fictional test lead for each contact, financing, watchlist, capital partner, consultation path; confirm exactly one correctly tagged GRCRM record, appropriate consent, duplicate handling, delivery status and suppression. |
| PNC-04 | P0 | Property feed | Select licensed/publicly displayable source for each target jurisdiction; record source terms, refresh cadence, provenance, stale-date and removal rules. Run staging import and review before publishing. |
| PNC-05 | P0 | Investment compliance | Counsel review of securities/broker-dealer/adviser, CA real-estate/trust-deed rules, disclosure, permissible investor solicitation, accreditation/suitability where applicable, privacy, telemarketing, state-by-state licensing. Do not present guaranteed interest or public deal solicitations until reviewed. |
| PNC-06 | P1 | Search UX | Verify search and calendar show freshness, auction status, source URL, date last checked, important disclaimers and no-results alternatives; validate against source records. |
| PNC-07 | P1 | Investor intake | Capture individual/entity, state, capital range, preferred asset/lien/term, experience, preferred follow-up and separate consent; do not collect sensitive banking documentation in unsecured public forms. |
| PNC-08 | P1 | SEO | Check Google Search Console ownership, sitemap.xml, robots.txt, canonical tags, indexability, metadata, structured data where factually appropriate, and mobile performance. Add intent pages only with substantive, non-duplicative content. |
| PNC-09 | P1 | Analytics | Privacy-aware events: search, filter, property detail, watchlist opt-in, financing intent, investor intake, booking, qualified lead and funded deal; connect source/UTM through GRCRM. |
| PNC-10 | P1 | Cross-property routing | Use explicit contextual links to CADeed and Pegasus, consistent disclosures, tagged referrals; no implied shared borrower consent. |
| PNC-11 | P2 | Distribution | Publish useful weekly foreclosure market updates AFTER permitted data feed is live; partner outreach, licensed SEO content and segmented opt-in email. |
| PNC-12 | P2 | Experimentation | A/B landing copy and clear CTAs; only after instrumentation. No paid ads until P0 proof and compliance sign-off. |

## Suggested homepage architecture
- Hero: **Find foreclosure opportunities. Evaluate the property. Arrange acquisition capital.**
- Search filters: state/county/city, stage, date, price, property type.
- Upcoming auction opportunities: only verified sourced records; otherwise explain feed status and offer criteria-based alerts.
- Financing options: auction, bridge, rehabilitation, DSCR takeout and private capital review, subject to eligibility.
- Separate investor area with plain-language private-note mechanics, risk disclosure and inquiry intake.
- Transparency: data sources/refresh timestamps, operator identity, contact, privacy, terms.

## Content roadmap (specific search intent)
- California foreclosure auction guide; trustee sales and due diligence (source-linked).
- Florida foreclosure auction process (county-specific official references).
- Buying auction property with cash or acquisition capital.
- Understanding first-position deeds of trust and LTV; risks of private mortgage notes.
- Bridge vs fix-and-flip vs DSCR takeout scenarios.
No legal process guides are to be published without state-specific source/legal review.

## Lead lifecycle and measurement
Inbound -> Consent recorded -> Qualified -> Property/deal review -> Matched to authorized licensed capital source -> Terms discussion -> Closed / not proceeded.
Minimum KPI dashboard: authorized sourced live records; search-to-property CTR; qualified investor inquiries; finance review inquiries; consented weekly subscribers; GRCRM delivery failures; appointment completion; funded volume. Report actual values, never projections as facts.

## First delivery sequence
1. Inspect actual production deploy, env and database, then baseline funnel tests.
2. Resolve property sourcing/licensing and implement importer + freshness report.
3. Resolve CRM idempotency, contact consent and investor screening.
4. Complete investment-offering/compliance review and SEO technical verification.
5. Launch content, partner distribution and measured experiments.
6. Weekly operating review by actual conversion and data freshness.

## Current evidence / uncertainty
- Public homepage currently reports no visible imported opportunities.
- GitHub README documents a unified Next.js 15 + Supabase + Netlify architecture and centralized GRCRM integration; README claims are not a substitute for runtime verification.
- Historical predeployment reports can be stale; verify current version before treating blockers as open or fixed.
- No production backend state or real lead deliveries have been validated in this plan.
