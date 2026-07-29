import type { Metadata } from "next";
import { Shell } from "@/components/ui";
import { FilterPanel } from "@/components/search/FilterPanel";
import { PropertyCard } from "@/components/search/PropertyCard";
import { Pagination } from "@/components/search/Pagination";
import { EmptyState } from "@/components/ui";
import { getServerSupabase } from "@/lib/supabase/server";
import { parseSearchParams, runSearch } from "@/lib/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Properties",
  description: "Search California & Florida foreclosure and auction opportunities.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filter = parseSearchParams(searchParams);
  const supabase = getServerSupabase();
  const result = await runSearch(supabase, filter);

  return (
    <Shell className="py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">Search Properties</h1>
        <p className="mt-1 text-sm text-navy-muted">
          {result.configured
            ? `${result.total.toLocaleString("en-US")} ${result.total === 1 ? "record" : "records"} matching your filters`
            : "Live data is being connected. Set your filters — matching records will appear here."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <FilterPanel filter={filter} />
        </aside>

        <div>
          {result.rows.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {result.rows.map((p) => (
                  <PropertyCard key={p.id} p={p} />
                ))}
              </div>
              <Pagination filter={filter} total={result.total} />
            </>
          ) : (
            <EmptyState title="No matching properties">
              {result.configured ? (
                <>Try widening your filters — remove a county, extend the auction date range, or clear the price limits.</>
              ) : (
                <>No approved data is loaded yet. Listings only ever come from real imported sources — nothing here is fabricated.</>
              )}
            </EmptyState>
          )}
        </div>
      </div>
    </Shell>
  );
}
