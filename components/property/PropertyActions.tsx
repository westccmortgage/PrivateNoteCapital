"use client";

import { useState } from "react";
import { Bookmark, BellRing, FileSearch, Banknote, Hammer, TrendingUp, ExternalLink } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { AuthForm } from "@/components/forms/AuthForm";
import { useUser } from "@/lib/use-user";
import { readAttribution } from "@/lib/attribution";
import { getBrowserSupabase } from "@/lib/supabase/client";

interface Props {
  propertyId: string;
  address: string;
  state: string;
  county: string;
  auctionDate: string | null;
  sourceUrl: string | null;
}

// All property actions. Save/Track are auth-gated (inline register if needed).
// Financing/review actions deep-link to the short financing intake, connected to
// this property. Open Official Source is an external link (only when present).
export function PropertyActions({ propertyId, address, state, county, auctionDate, sourceUrl }: Props) {
  const { user, configured } = useUser();
  const [showAuth, setShowAuth] = useState(false);
  const [pending, setPending] = useState<null | "save" | "track">(null);
  const [status, setStatus] = useState<string | null>(null);

  const finBase = `/financing?propertyId=${encodeURIComponent(propertyId)}&propertyAddress=${encodeURIComponent(address)}&state=${encodeURIComponent(state)}&county=${encodeURIComponent(county)}`;

  async function doSaveOrTrack(kind: "save" | "track") {
    if (!user) {
      setPending(kind);
      setShowAuth(true);
      return;
    }
    const supabase = getBrowserSupabase();
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          propertyId,
          alertEnabled: kind === "track",
          action: kind === "track" ? "track_auction" : "save",
          attribution: readAttribution(),
        }),
      });
      const json = await res.json();
      setStatus(res.ok ? (kind === "track" ? "Auction tracking on. We'll note changes." : "Saved to your list.") : json.error || "Could not save.");
    } catch {
      setStatus("Network error. Please try again.");
    }
  }

  return (
    <Card className="p-4">
      <p className="mb-3 font-serif text-lg font-semibold text-navy">Actions</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button variant="ghost" onClick={() => doSaveOrTrack("save")}><Bookmark size={17} /> Save Property</Button>
        <Button variant="ghost" onClick={() => doSaveOrTrack("track")}><BellRing size={17} /> Track Auction</Button>
        <Button variant="ghost" href={`${finBase}&type=private_capital&intent=review`}><FileSearch size={17} /> Request Deal Review</Button>
        <Button variant="ghost" href={`${finBase}&type=auction_acquisition`}><Banknote size={17} /> Acquisition Financing</Button>
        <Button variant="ghost" href={`${finBase}&type=rehabilitation`}><Hammer size={17} /> Rehabilitation Financing</Button>
        <Button variant="ghost" href={`${finBase}&type=dscr_takeout`}><TrendingUp size={17} /> DSCR Takeout</Button>
      </div>

      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-hairlineStrong bg-surface px-5 py-2.5 text-[15px] font-semibold text-navy hover:border-navy-muted"
        >
          <ExternalLink size={17} /> Open Official Source
        </a>
      ) : null}

      {status ? <p className="mt-3 text-sm text-positive">{status}</p> : null}

      {showAuth ? (
        <div className="mt-4 rounded-lg border border-hairline bg-canvas p-4">
          <p className="mb-2 text-sm text-navy-muted">
            Create a free account (or sign in) to {pending === "track" ? "track this auction" : "save this property"}. No mortgage application required.
          </p>
          {configured ? (
            <AuthForm
              initialMode="register"
              compact
              onSignedIn={() => {
                setShowAuth(false);
                if (pending) doSaveOrTrack(pending);
              }}
            />
          ) : (
            <p className="text-sm text-warn">Accounts are not enabled yet.</p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
