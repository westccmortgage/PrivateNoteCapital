import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { hasSearchListings, hasUpcomingAuctions } from "@/lib/listing-status";

// Public, indexable routes only. Property detail pages are intentionally not
// enumerated here (they depend on live, permission-gated data).
const ROUTES = [
  "",
  "/hard-money-loans",
  "/search",
  "/florida/foreclosure-auctions",
  "/california/investor-opportunities",
  "/calendar",
  "/watchlist",
  "/financing",
  "/private-debt",
  "/private-debt/investors",
  "/private-debt/faq",
  "/private-debt/review",
  "/company",
  "/about-data",
  "/guides/foreclosure-auction-due-diligence",
  "/resources/official-foreclosure-auctions",
  "/privacy",
  "/terms",
  "/contact",
];

// Re-check hourly whether /search and /calendar have data (see lib/listing-status).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [search, calendar] = await Promise.all([hasSearchListings(), hasUpcomingAuctions()]);
  const hidden = new Set<string>([...(search ? [] : ["/search"]), ...(calendar ? [] : ["/calendar"])]);
  return ROUTES.filter((path) => !hidden.has(path)).map((path) => ({
    url: `${SITE.url}${path}`,
    changeFrequency: path === "/search" || path === "/calendar" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
