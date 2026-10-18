import { test } from "node:test";
import assert from "node:assert/strict";
import { FLORIDA_AUCTION_SOURCES } from "@/lib/florida-auctions";

test("Florida resource links point to Clerk-controlled official sites", () => {
  const allowed = new Set([
    "www.mypalmbeachclerk.com",
    "www.browardclerk.org",
    "www.miamidadeclerk.gov",
    "www.hillsclerk.com",
    "www.myorangeclerk.com",
    "www.duvalclerk.gov",
  ]);
  assert.equal(FLORIDA_AUCTION_SOURCES.length, 6);
  assert.equal(new Set(FLORIDA_AUCTION_SOURCES.map((x) => x.county)).size, 6);
  for (const item of FLORIDA_AUCTION_SOURCES) {
    const url = new URL(item.clerkUrl);
    assert.equal(url.protocol, "https:");
    assert.ok(allowed.has(url.hostname), `unexpected external domain: ${url.hostname}`);
    assert.ok(item.access.length > 30);
  }
});

test("County directory does not silently substitute private property inventory", () => {
  assert.ok(FLORIDA_AUCTION_SOURCES.every((x) => !("property" in x || "currentSaleDate" in x)));
});
