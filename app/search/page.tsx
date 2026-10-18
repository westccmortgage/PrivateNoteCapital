import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Shell, Button } from "@/components/ui";
import { FilterPanel } from "@/components/search/FilterPanel";
import { PropertyCard } from "@/components/search/PropertyCard";
import { Pagination } from "@/components/search/Pagination";
import { EmptyState } from "@/components/ui";
import { getServerSupabase } from "@/lib/supabase/server";
import { parseSearchParams, runSearch } from "@/lib/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Properties",
  description: "Search Florida foreclosure and auction opportunities. California sale listings are in the separate investor directory.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  if (String(Array.isArray(raw.state) ? raw.state[0] : raw.state || "").toUpperCase() === "CA") {
    redirect("/california/investor-opportunities");
  }
  const filter = parseSearchParams(raw); // Florida foreclosure only
  const supabase = await getServerSupabase();
  const result = await runSearch(supabase, filter);

  return (
    <Shell className="py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">Florida Foreclosure Search</h1>
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
              <div className="space-y-3">
                <p>
                  No matching, approved property records are currently published in our database.
                  Auction calendars may still have sales that are not imported here.
                </p>
                {filter.state === "FL" || !filter.state ? (
                  <Button href="/florida/foreclosure-auctions" size="sm" variant="ghost">
                    Browse official Florida County Clerk calendars
                  </Button>
                ) : (
                  <Button href="/resources/official-foreclosure-auctions" size="sm" variant="ghost">
                    View official source resources
                  </Button>
                )}
              </div>
            </EmptyState>
          )}
        </div>
      </div>
    </Shell>
  );
}
