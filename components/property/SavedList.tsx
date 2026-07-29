"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, FileSearch } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { type ForeclosureProperty, propertyTitle, formatDate, formatMoney, displayEquity } from "@/lib/property";
import { labelFor, FORECLOSURE_STAGES } from "@/lib/constants";

export interface SavedItem {
  property_id: string;
  alert_enabled: boolean;
  property: ForeclosureProperty | null;
}

export function SavedList({ items }: { items: SavedItem[] }) {
  const [list, setList] = useState(items);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(propertyId: string) {
    setBusy(propertyId);
    const res = await fetch(`/api/saved?propertyId=${encodeURIComponent(propertyId)}`, { method: "DELETE" });
    if (res.ok) setList((l) => l.filter((i) => i.property_id !== propertyId));
    setBusy(null);
  }

  if (list.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-serif text-lg text-navy">No saved properties yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-navy-muted">
          Save opportunities from search or a property page and they&apos;ll appear here with their
          auction dates and any changes.
        </p>
        <Link href="/search" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
          Search properties →
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((i) => {
        const p = i.property;
        return (
          <Card key={i.property_id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {p?.foreclosure_stage ? <Badge tone="accent">{labelFor(FORECLOSURE_STAGES, p.foreclosure_stage)}</Badge> : null}
                  {i.alert_enabled ? <Badge tone="positive">Tracking</Badge> : null}
                </div>
                <Link href={`/property/${i.property_id}`} className="mt-1 block font-serif text-lg font-semibold text-navy hover:underline">
                  {p ? propertyTitle(p) : "Property"}
                </Link>
                {p ? (
                  <p className="mt-1 text-sm text-navy-muted tnum">
                    Auction {formatDate(p.current_auction_date)} · Opening {formatMoney(p.opening_bid)} · Equity {formatMoney(displayEquity(p))}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-navy-muted">This property is no longer published.</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/financing?propertyId=${encodeURIComponent(i.property_id)}&propertyAddress=${encodeURIComponent(p ? propertyTitle(p) : "")}&type=private_capital&intent=review`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-hairlineStrong bg-surface px-3 py-2 text-sm font-semibold text-navy hover:border-navy-muted"
                >
                  <FileSearch size={16} /> Review
                </Link>
                <button
                  onClick={() => remove(i.property_id)}
                  disabled={busy === i.property_id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-hairlineStrong bg-surface px-3 py-2 text-sm text-navy-muted hover:border-warn hover:text-warn"
                  aria-label="Remove saved property"
                >
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
