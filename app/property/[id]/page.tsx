import { notFound } from "next/navigation";
import { Shell, Card, Badge } from "@/components/ui";
import { PropertyActions } from "@/components/property/PropertyActions";
import { getServerSupabase } from "@/lib/supabase/server";
import { supabasePublicConfigured } from "@/lib/env";
import { labelFor, FORECLOSURE_STAGES, PROPERTY_TYPES, OCCUPANCY } from "@/lib/constants";
import {
  type ForeclosureProperty,
  type AuctionEvent,
  propertyTitle,
  propertyLocation,
  displayEquity,
  formatDate,
  formatDateTime,
  bedBath,
  formatMoney,
} from "@/lib/property";

export const dynamic = "force-dynamic";

async function fetchProperty(id: string): Promise<{ p: ForeclosureProperty | null; events: AuctionEvent[] }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { p: null, events: [] };
  const { data: p } = await supabase
    .from("foreclosure_properties")
    .select("*")
    .eq("id", id)
    .eq("record_status", "published")
    .maybeSingle();
  if (!p) return { p: null, events: [] };
  const { data: events } = await supabase
    .from("auction_events")
    .select("*")
    .eq("property_id", id)
    .order("created_at", { ascending: false });
  return { p: p as ForeclosureProperty, events: (events ?? []) as AuctionEvent[] };
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Next 15: params is async
  const { p, events } = await fetchProperty(id);

  if (!p) {
    // A genuinely missing published record is a 404; an unconfigured backend
    // shows a soft "not available yet" state instead of a hard error.
    if (supabasePublicConfigured()) notFound();
    return (
      <Shell className="py-16">
        <Card className="p-8 text-center">
          <p className="font-serif text-xl text-navy">This property isn&apos;t available yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-navy-muted">
            Property records are loaded from approved data sources. Please check back, or set up a
            weekly watchlist to be notified when matching auctions are added.
          </p>
        </Card>
      </Shell>
    );
  }

  const equity = displayEquity(p);
  const rows: [string, string][] = [
    ["Address", p.address ?? "—"],
    ["APN / Parcel", p.apn ?? "—"],
    ["County", p.county ?? "—"],
    ["State", p.state],
    ["Property type", labelFor(PROPERTY_TYPES, p.property_type)],
    ["Beds / Baths / Size", bedBath(p)],
    ["Foreclosure stage", labelFor(FORECLOSURE_STAGES, p.foreclosure_stage)],
    ["Auction date", formatDate(p.current_auction_date)],
    ["Original auction date", formatDate(p.original_auction_date)],
    ["Opening bid", formatMoney(p.opening_bid)],
    ["Estimated value", formatMoney(p.estimated_value)],
    ["Estimated debt", formatMoney(p.estimated_debt)],
    ["Estimated equity", formatMoney(equity)],
    ["Occupancy", labelFor(OCCUPANCY, p.occupancy_status)],
    ["Previous sale", p.previous_sale_date ? `${formatDate(p.previous_sale_date)} · ${formatMoney(p.previous_sale_price)}` : "—"],
  ];

  return (
    <Shell className="py-8">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {p.foreclosure_stage ? <Badge tone="accent">{labelFor(FORECLOSURE_STAGES, p.foreclosure_stage)}</Badge> : null}
        <Badge>{p.state}</Badge>
      </div>
      <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">{propertyTitle(p)}</h1>
      <p className="mt-1 text-navy-muted">{propertyLocation(p)}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <dl className="divide-y divide-hairline">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[150px_1fr] gap-3 px-4 py-2.5 text-sm sm:grid-cols-[200px_1fr]">
                  <dt className="font-mono text-[11px] uppercase tracking-wide text-navy-muted">{k}</dt>
                  <dd className="tnum font-medium text-navy">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Auction change history */}
          {events.length > 0 ? (
            <Card className="p-4">
              <p className="mb-3 font-serif text-lg font-semibold text-navy">Auction history</p>
              <ul className="flex flex-col gap-3">
                {events.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <div>
                      <p className="font-medium text-navy">{e.event_type.replace(/_/g, " ")}</p>
                      <p className="text-navy-muted">
                        {e.previous_value ? `${e.previous_value} → ` : ""}
                        {e.new_value ?? ""} {e.event_date ? `· ${formatDate(e.event_date)}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* Required: source, last updated, disclaimer */}
          <Card className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-navy-muted">Data source</p>
                <p className="font-medium text-navy">{p.source_name}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-navy-muted">Last updated</p>
                <p className="font-medium text-navy">{formatDateTime(p.source_last_updated_at ?? p.updated_at)}</p>
              </div>
            </div>
            <p className="mt-3 border-t border-hairline pt-3 text-xs text-navy-muted">
              Information availability disclaimer: property records may change and auction dates can be
              postponed or cancelled. Estimated values are not appraisals. You must independently verify
              title, liens, occupancy, taxes, HOA obligations, court records, and auction requirements.
              Private Note Capital is not the auction operator.
            </p>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <PropertyActions
            propertyId={p.id}
            address={propertyTitle(p)}
            state={p.state}
            county={p.county ?? ""}
            auctionDate={p.current_auction_date}
            sourceUrl={p.source_url}
          />
        </div>
      </div>
    </Shell>
  );
}
