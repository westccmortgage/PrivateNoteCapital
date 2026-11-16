import { createClient } from "@supabase/supabase-js";
import { publicEnv, supabasePublicConfigured } from "@/lib/env";

// Do the data-driven listing pages (/search, /calendar) have anything to show?
// While the foreclosure table is empty those pages render an empty state, which
// Google reports as "Soft 404". We keep them out of the index (noindex + left
// out of the sitemap) until real records exist, and they come back on their own.
//
// Cookie-less anon client so this also works in sitemap.ts (no request scope).
// On a query error we answer "true" (keep indexable): a transient outage must
// not deindex pages.

function anonClient() {
  if (!supabasePublicConfigured()) return null;
  return createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function hasRows(upcomingOnly: boolean): Promise<boolean> {
  const supabase = anonClient();
  if (!supabase) return false;
  let q = supabase
    .from("foreclosure_properties")
    .select("id", { count: "exact", head: true })
    .eq("record_status", "published")
    .eq("state", "FL");
  if (upcomingOnly) q = q.gte("current_auction_date", new Date().toISOString().slice(0, 10));
  const { count, error } = await q;
  if (error) return true;
  return (count ?? 0) > 0;
}

/** Any published Florida record (drives /search). */
export const hasSearchListings = () => hasRows(false);

/** Any published Florida auction dated today or later (drives /calendar). */
export const hasUpcomingAuctions = () => hasRows(true);

/** robots value for a listing page: index normally, noindex while empty. */
export const listingRobots = (hasData: boolean) =>
  hasData ? undefined : { index: false, follow: true };
