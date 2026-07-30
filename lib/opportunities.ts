// Server-side fetchers for the homepage opportunity sections. Each returns only
// PUBLISHED rows (RLS) and an empty array when unconfigured — the homepage hides
// any section with no records, so no decorative/empty cards ever render.

import { getServerSupabase } from "@/lib/supabase/server";
import type { ForeclosureProperty } from "@/lib/property";

const LIMIT = 6;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoIso(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

export interface OpportunitySection {
  key: string;
  title: string;
  rows: ForeclosureProperty[];
}

export async function getHomeSections(): Promise<OpportunitySection[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const base = () =>
    supabase.from("foreclosure_properties").select("*").eq("record_status", "published");

  const [upcoming, fresh, postponed, reo, highEquity] = await Promise.all([
    base().gte("current_auction_date", today()).order("current_auction_date", { ascending: true }).limit(LIMIT),
    base().gte("created_at", daysAgoIso(7)).order("created_at", { ascending: false }).limit(LIMIT),
    base().eq("foreclosure_stage", "postponed").order("updated_at", { ascending: false }).limit(LIMIT),
    base().eq("foreclosure_stage", "reo_bank_owned").order("updated_at", { ascending: false }).limit(LIMIT),
    base().gt("estimated_equity", 0).order("estimated_equity", { ascending: false }).limit(LIMIT),
  ]);

  const sections: OpportunitySection[] = [
    { key: "upcoming", title: "Upcoming Auctions", rows: (upcoming.data ?? []) as ForeclosureProperty[] },
    { key: "new", title: "New This Week", rows: (fresh.data ?? []) as ForeclosureProperty[] },
    { key: "postponed", title: "Recently Postponed", rows: (postponed.data ?? []) as ForeclosureProperty[] },
    { key: "reo", title: "Bank-Owned Properties", rows: (reo.data ?? []) as ForeclosureProperty[] },
    { key: "equity", title: "High-Equity Opportunities", rows: (highEquity.data ?? []) as ForeclosureProperty[] },
  ];

  // Only sections that actually have records.
  return sections.filter((s) => s.rows.length > 0);
}
