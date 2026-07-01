import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

const ROUTES = ["", "/company", "/faq", "/legal"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE.url}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
