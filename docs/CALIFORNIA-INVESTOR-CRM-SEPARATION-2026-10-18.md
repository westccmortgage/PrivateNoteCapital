# California investor listings — separate product & source controls
**Updated:** 2026-10-18. Operator: West Coast Capital Mortgage Inc.

## User-approved product distinction
California data from GRCRM / PropertyRadar is **not** to be represented as a foreclosure auction feed. California Investor Listings and Florida Foreclosure Auctions are separate public pages and query paths.

### Data-handling boundaries
- PropertyRadar market research and prospect-contact data belong to the authenticated internal GRCRM workspace. No private CRM record, owner phone/email, credit or mortgage field is eligible for this public listing page.
- GRCRM also provides an intentional **public listing projection** used by a separate brokerage marketplace. Its publication workflow is controlled by the listing owner; status and inventory count change over time.
- California property information must not be called an auction, trustee sale, foreclosure, investment return, or confirmed for-sale prospect unless supported by that specific property's authorized listing.

## Public implementation
1. `/california/investor-opportunities` reads only the existing **public CRM marketplace feed** `/.netlify/functions/marketplace-public-feed?marketplace=west-coast-capital-realty`. This endpoint restricts records to the intentionally published projection and filters revoked/deleted CRM listings.
2. Our server applies a strict second check: `state=CA`, `purpose=Sale`, `status=Active`, no demos; only whitelisted safe display fields (address, locality, asking price, property type, basic metrics, last CRM update and source URL) are rendered. No owner names, phone/email, borrower data, PropertyRadar records or speculative financial metrics.
3. Each listing links to the original brokerage publication, and acquisition financing inquiries follow the already-verified PNC → GRCRM lead pipeline. No separate bulk copy of private CRM/PropertyRadar records is stored in the foreclosure DB.
4. If the public CRM feed is unavailable or empty, show no cards and no fabricated properties.

## Florida isolation guard
- The public `foreclosure_properties` search and all homepage auction sections are restricted server-side to `state='FL'`.
- `/calendar` likewise filters to FL. Search with `?state=CA` redirects to the California investor page; `/api/search?state=CA` returns a redirect hint with HTTP 400.
- Watchlist auction selection and API accept FL only. No California owner/prospect data is ever passed to `foreclosure_properties` or `auction_events`.

## PropertyRadar agreement
User has given explicit operator permission to work with their subscribed PropertyRadar data in GRCRM. That does **not automatically expand PropertyRadar's standard sublicensing terms**. The public User Agreement (effective Feb 26, 2026) limits use to internal business purposes and restricts publication, redistribution and derivative public data products: https://www.propertyradar.com/user-agreement .

If there is a custom written public-display / redistribution agreement, review the specific permitted fields and use separately. Until documented, keep the existing PropertyRadar lead_universe and contacts internal. Do not treat an `in_foreclosure` score/flag as proof of an active court/trustee auction. The public California page uses brokerage listings independently published by listing owners, **not** PropertyRadar marketing records.

## Operating validation
- California feed returns selected public active sale listings only.
- Seller asking price is not a market appraisal or investment analysis.
- Privacy protections preserve the original public-privacy projection. DNC/contact data stays within GRCRM.
- On sold, withdrawn or unpublished property, it disappears on next CRM feed read (no-store + CRM published projection).
- Reverify last-updated dates, original public listing URL, partner licensing/disclosures and production release before increasing SEO/paid distribution.
