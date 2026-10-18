import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allProviders, getProvider } from "@/lib/providers/registry";
import {
  publicCaliforniaListing,
  selectPublicCaliforniaListings,
} from "@/lib/california-listings";

const active = {
  slug: "123-olive-avenue-ca123",
  address: "123 Olive Avenue",
  city: "Burbank",
  zip: "91502",
  state: "CA",
  purpose: "Sale",
  status: "Active",
  price: 750000,
  beds: 3,
  baths: 2,
  sqft: 1560,
  property_type: "Single Family",
  updated_at: "2026-10-18T12:00:00Z",
};

test("only active, California, seller-published sale listings are eligible", () => {
  assert.ok(publicCaliforniaListing(active));
  assert.equal(publicCaliforniaListing({ ...active, state: "FL" }), null);
  assert.equal(publicCaliforniaListing({ ...active, purpose: "Rent" }), null);
  assert.equal(publicCaliforniaListing({ ...active, status: "Sold" }), null);
  assert.equal(publicCaliforniaListing({ ...active, status: "Pending" }), null);
  assert.equal(publicCaliforniaListing({ ...active, published: false }), null);
  assert.equal(publicCaliforniaListing({ ...active, demo: true }), null);
  assert.equal(publicCaliforniaListing({ ...active, mls: "DEMO-12" }), null);
  assert.equal(publicCaliforniaListing({ ...active, slug: "../anything" }), null);
});

test("public listing projection never exposes owner, marketing contact, mortgage or foreclosure metadata", () => {
  const projected = publicCaliforniaListing({
    ...active,
    owner: "Do not expose this field",
    phone: "555-1234",
    email: "private@example.com",
    radar_id: "private",
    first_balance: 500000,
    equity_percent: 65,
    in_foreclosure: true,
    foreclosure_stage: "Auction",
    contact_id: "private",
    agent: { email: "agent@example.com", phone: "private" },
  });
  assert.ok(projected);
  const text = JSON.stringify(projected);
  for (const fragment of [
    "Do not expose", "555-1234", "private@example.com", "radar_id",
    "first_balance", "in_foreclosure", "foreclosure_stage", "contact_id", "agent",
  ]) {
    assert.ok(!text.includes(fragment), `Must not expose: ${fragment}`);
  }
  assert.equal(projected?.originalUrl, "https://westcoastcapitalrealty.com/listings/123-olive-avenue-ca123");
});

test("public feed selection removes duplicate and out-of-scope rows", () => {
  const list = selectPublicCaliforniaListings([
    active,
    { ...active, price: 500000 },
    { ...active, slug: "another-property", status: "Sold" },
    { ...active, slug: "123-florida", state: "FL" },
  ]);
  assert.equal(list.length, 1);
  assert.equal(list[0].price, 750000);
});

test("California public listings consume published brokerage feed, not PropertyRadar lead records", () => {
  const src = readFileSync("lib/california-listings.ts", "utf8");
  assert.match(src, /marketplace-public-feed/);
  assert.match(src, /west-coast-capital-realty/);
  assert.doesNotMatch(src, /\.from\(["'](?:lead_universe|pr_properties|crm_contacts)["']/);
});

test("California foreclosure event provider is disabled", () => {
  assert.equal(getProvider("la_county_recorder"), undefined);
  assert.ok(allProviders().every((provider) => provider.state === "FL"));
});

test("California rows are refused by the foreclosure importer even as drafts", () => {
  const route = readFileSync("app/api/admin/import/route.ts", "utf8");
  assert.match(route, /adapter.state === "CA"/);
  assert.match(route, /row.state !== "FL"/);
});

test("Florida-only route protects direct property-detail reads", () => {
  const source = readFileSync("app/property/[id]/page.tsx", "utf8");
  assert.match(source, /\.eq\("state", "FL"\)/);
});
