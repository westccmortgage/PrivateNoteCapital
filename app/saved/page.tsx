import type { Metadata } from "next";
import Link from "next/link";
import { Shell, Card } from "@/components/ui";
import { AuthForm } from "@/components/forms/AuthForm";
import { SavedList, type SavedItem } from "@/components/property/SavedList";
import { getServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { supabasePublicConfigured } from "@/lib/env";
import type { ForeclosureProperty } from "@/lib/property";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved Properties",
  robots: { index: false },
};

export default async function SavedPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Shell className="py-12">
        <div className="mx-auto max-w-md">
          <h1 className="font-serif text-2xl font-semibold text-navy">Saved Properties</h1>
          <p className="mt-2 text-sm text-navy-muted">
            Sign in or create a free account to view your saved properties and auction tracking.
          </p>
          <div className="mt-6">
            {supabasePublicConfigured() ? (
              <AuthForm initialMode="signin" next="/saved" />
            ) : (
              <Card className="p-6 text-center text-sm text-navy-muted">Accounts are not enabled yet.</Card>
            )}
          </div>
          <p className="mt-4 text-sm text-navy-muted">
            Just browsing? <Link href="/search" className="text-accent hover:underline">Search without an account →</Link>
          </p>
        </div>
      </Shell>
    );
  }

  const supabase = await getServerSupabase();
  let items: SavedItem[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("saved_properties")
      .select("property_id, alert_enabled, foreclosure_properties(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    items = (data ?? []).map((r) => ({
      property_id: r.property_id as string,
      alert_enabled: Boolean(r.alert_enabled),
      property: (r.foreclosure_properties as unknown as ForeclosureProperty | null) ?? null,
    }));
  }

  return (
    <Shell className="py-8">
      <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">Saved Properties</h1>
      <p className="mt-1 text-sm text-navy-muted">Your saved opportunities, auction dates, and tracking.</p>
      <div className="mt-6">
        <SavedList items={items} />
      </div>
    </Shell>
  );
}
