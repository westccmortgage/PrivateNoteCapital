import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Public, indexable routes only. Property detail pages are intentionally not
// enumerated here (they depend on live, permission-gated data).
const ROUTES = [
  "",
  "/search",
  "/calendar",
  "/watchlist",
  "/financing",
  "/about-data",
  "/privacy",
  "/terms",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE.url}${path}`,
    changeFrequency: path === "/search" || path === "/calendar" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
