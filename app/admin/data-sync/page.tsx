import type { Metadata } from "next";
import { Shell } from "@/components/ui";
import { DataSyncPanel } from "@/components/admin/DataSyncPanel";
import { getAdminSupabase } from "@/lib/supabase/server";
import { getCountyStatuses } from "@/lib/providers/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "County data sync",
  robots: { index: false },
};

export default async function DataSyncPage() {
  const admin = getAdminSupabase();
  const counties = await getCountyStatuses(admin);

  return (
    <Shell className="py-8">
      <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">County data sync</h1>
      <p className="mt-1 max-w-2xl text-sm text-navy-muted">
        Automatic collectors for Palm Beach County (FL) and Los Angeles County (CA). Official sources
        only. Only public-official or contract-authorized records publish automatically; everything else
        is held as draft. Credentials are never shown here. CSV upload remains available as a backup at{" "}
        <a href="/admin/import" className="font-semibold text-accent hover:underline">/admin/import</a>.
      </p>
      <div className="mt-6">
        <DataSyncPanel initial={counties} />
      </div>
    </Shell>
  );
}
