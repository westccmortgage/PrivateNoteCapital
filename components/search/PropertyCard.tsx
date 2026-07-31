import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  type ForeclosureProperty,
  propertyTitle,
  propertyLocation,
  displayEquity,
  formatDate,
  bedBath,
  formatMoney,
} from "@/lib/property";
import { labelFor, sourceLabel } from "@/lib/constants";
import { FORECLOSURE_STAGES } from "@/lib/constants";

function stageTone(stage: string | null): "neutral" | "accent" | "warn" {
  if (stage === "postponed" || stage === "cancelled") return "warn";
  if (stage === "auction" || stage === "notice_of_sale") return "accent";
  return "neutral";
}

// Compact, data-first property card. No hero imagery — numbers and source.
export function PropertyCard({ p }: { p: ForeclosureProperty }) {
  const equity = displayEquity(p);
  return (
    <Link
      href={`/property/${p.id}`}
      className="block rounded-card border border-hairline bg-surface p-4 shadow-soft transition-colors hover:border-navy-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-serif text-[17px] font-semibold text-navy">
            {propertyTitle(p)}
          </p>
          <p className="mt-0.5 truncate text-sm text-navy-muted">{propertyLocation(p)}</p>
        </div>
        {p.foreclosure_stage ? (
          <Badge tone={stageTone(p.foreclosure_stage)}>
            {labelFor(FORECLOSURE_STAGES, p.foreclosure_stage)}
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <Metric label="Auction" value={formatDate(p.current_auction_date)} />
        <Metric label="Opening bid" value={formatMoney(p.opening_bid)} num />
        <Metric label="Est. value" value={formatMoney(p.estimated_value)} num />
        <Metric label="Est. equity" value={formatMoney(equity)} num tone={equity && equity > 0 ? "positive" : undefined} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-xs text-navy-muted">
        <span className="truncate">{bedBath(p)}</span>
        <span className="ml-2 shrink-0 truncate font-mono uppercase tracking-wide" title={sourceLabel(p.source_name)}>{sourceLabel(p.source_name)}</span>
      </div>
    </Link>
  );
}

function Metric({
  label,
  value,
  num,
  tone,
}: {
  label: string;
  value: string;
  num?: boolean;
  tone?: "positive";
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wide text-navy-muted">{label}</p>
      <p className={`${num ? "tnum" : ""} font-semibold ${tone === "positive" ? "text-positive" : "text-navy"}`}>
        {value}
      </p>
    </div>
  );
}
