import type { Metadata } from "next";
import { Shell, Kicker } from "@/components/ui";
import { WatchlistForm } from "@/components/forms/WatchlistForm";

export const metadata: Metadata = {
  title: "Weekly Watchlist",
  description:
    "Request notifications about verified Florida auction opportunities matching your criteria.",
};

export default function WatchlistPage() {
  return (
    <Shell className="py-10">
      <div className="mx-auto max-w-2xl">
        <Kicker>Stay ahead of the calendar</Kicker>
        <h1 className="font-serif text-3xl font-semibold text-navy">Florida Auction Watchlist</h1>
        <p className="mt-2 text-navy-muted">
          Choose your Florida auction research criteria. Notifications require a verified
          auction data feed and a working alert-delivery service; you may unsubscribe at any time.
        </p>
        <div className="mt-6">
          <WatchlistForm />
        </div>
      </div>
    </Shell>
  );
}
