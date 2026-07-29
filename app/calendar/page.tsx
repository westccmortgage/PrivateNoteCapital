import type { Metadata } from "next";
import Link from "next/link";
import { Shell, Card, EmptyState, Badge } from "@/components/ui";
import { getServerSupabase } from "@/lib/supabase/server";
import { type ForeclosureProperty, propertyTitle, propertyLocation, formatDate, formatMoney } from "@/lib/property";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Auction Calendar",
  description: "Upcoming California & Florida foreclosure auctions by date.",
};

export default async function CalendarPage() {
  const supabase = getServerSupabase();
  let rows: ForeclosureProperty[] = [];
  let configured = false;
  if (supabase) {
    configured = true;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("foreclosure_properties")
      .select("*")
      .eq("record_status", "published")
      .gte("current_auction_date", today)
      .order("current_auction_date", { ascending: true })
      .limit(200);
    rows = (data ?? []) as ForeclosureProperty[];
  }

  // Group by auction date.
  const groups = new Map<string, ForeclosureProperty[]>();
  for (const p of rows) {
    const key = p.current_auction_date ?? "Unscheduled";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  return (
    <Shell className="py-8">
      <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">Auction Calendar</h1>
      <p className="mt-1 text-sm text-navy-muted">
        Upcoming auctions by date. Dates can be postponed or cancelled — always verify with the official source.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {groups.size === 0 ? (
          <EmptyState title="No upcoming auctions loaded">
            {configured
              ? "There are no published auctions on the calendar right now."
              : "Auction data is being connected. Subscribe to the weekly watchlist to be notified."}
          </EmptyState>
        ) : (
          [...groups.entries()].map(([date, list]) => (
            <div key={date}>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="font-serif text-lg font-semibold text-navy">{formatDate(date)}</h2>
                <Badge>{list.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {list.map((p) => (
                  <Link key={p.id} href={`/property/${p.id}`}>
                    <Card className="p-3 transition-colors hover:border-navy-muted">
                      <p className="truncate font-medium text-navy">{propertyTitle(p)}</p>
                      <p className="truncate text-sm text-navy-muted">{propertyLocation(p)}</p>
                      <p className="mt-1 text-sm tnum text-navy-muted">Opening bid {formatMoney(p.opening_bid)}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}
