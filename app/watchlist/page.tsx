import type { Metadata } from "next";
import { Shell, Kicker } from "@/components/ui";
import { WatchlistForm } from "@/components/forms/WatchlistForm";

export const metadata: Metadata = {
  title: "Weekly Watchlist",
  description:
    "Get a weekly watchlist of California & Florida foreclosure and auction opportunities matching your criteria.",
};

export default function WatchlistPage() {
  return (
    <Shell className="py-10">
      <div className="mx-auto max-w-2xl">
        <Kicker>Stay ahead of the calendar</Kicker>
        <h1 className="font-serif text-3xl font-semibold text-navy">Weekly Watchlist</h1>
        <p className="mt-2 text-navy-muted">
          Tell us what you&apos;re looking for and we&apos;ll send a weekly list of matching
          opportunities. Nothing is sent until you opt in, and you can unsubscribe anytime.
        </p>
        <div className="mt-6">
          <WatchlistForm />
        </div>
      </div>
    </Shell>
  );
}
