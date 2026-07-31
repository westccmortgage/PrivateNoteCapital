import type { Metadata } from "next";
import { Shell, Card } from "@/components/ui";
import { ImportWizard } from "@/components/admin/ImportWizard";
import { getAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Import",
  robots: { index: false },
};

interface Job {
  id: string;
  source_name: string;
  filename: string | null;
  records_received: number;
  records_created: number;
  records_updated: number;
  records_rejected: number;
  created_at: string;
}

export default async function AdminImportPage() {
  const admin = getAdminSupabase();
  let history: Job[] = [];
  if (admin) {
    const { data } = await admin
      .from("import_jobs")
      .select("id, source_name, filename, records_received, records_created, records_updated, records_rejected, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    history = (data ?? []) as Job[];
  }

  return (
    <Shell className="py-8">
      <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">Data Import</h1>
      <p className="mt-1 text-sm text-navy-muted">
        CSV import is the <strong>backup</strong> path. The primary path is the automatic county
        collectors at{" "}
        <a href="/admin/data-sync" className="font-semibold text-accent hover:underline">/admin/data-sync</a>.
        Files validate before anything is written; invalid rows are rejected and downloadable. Restricted
        sources import as draft, never public.
      </p>

      <div className="mt-6">
        <ImportWizard />
      </div>

      <div className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-navy">Import history</h2>
        {history.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-navy-muted">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">File</th>
                  <th className="py-2 pr-4">Recv</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Updated</th>
                  <th className="py-2 pr-4">Rejected</th>
                </tr>
              </thead>
              <tbody>
                {history.map((j) => (
                  <tr key={j.id} className="border-t border-hairline">
                    <td className="py-2 pr-4 text-navy-muted">{new Date(j.created_at).toLocaleString("en-US")}</td>
                    <td className="py-2 pr-4">{j.source_name}</td>
                    <td className="py-2 pr-4 text-navy-muted">{j.filename ?? "—"}</td>
                    <td className="py-2 pr-4 tnum">{j.records_received}</td>
                    <td className="py-2 pr-4 tnum">{j.records_created}</td>
                    <td className="py-2 pr-4 tnum">{j.records_updated}</td>
                    <td className="py-2 pr-4 tnum">{j.records_rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Card className="mt-3 p-6 text-sm text-navy-muted">No imports yet.</Card>
        )}
      </div>
    </Shell>
  );
}
