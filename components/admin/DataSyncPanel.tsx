"use client";

import { useState } from "react";
import { Button, Card, Badge } from "@/components/ui";
import type { CountyStatus } from "@/lib/providers/status";

interface ConnResult {
  ok: boolean;
  configured: boolean;
  detail: string;
  blocker?: string | null;
  checkedAt: string;
}

export function DataSyncPanel({ initial }: { initial: CountyStatus[] }) {
  const [counties, setCounties] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [conn, setConn] = useState<Record<string, ConnResult>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});

  async function test(id: string) {
    setBusy(`test:${id}`);
    setMsg((m) => ({ ...m, [id]: "" }));
    try {
      const res = await fetch("/api/admin/data-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", provider: id }),
      });
      const json = await res.json();
      if (res.ok) setConn((c) => ({ ...c, [id]: json.connection }));
      else setMsg((m) => ({ ...m, [id]: json.error || "Test failed." }));
    } catch {
      setMsg((m) => ({ ...m, [id]: "Network error." }));
    } finally {
      setBusy(null);
    }
  }

  async function syncNow(id: string) {
    setBusy(`sync:${id}`);
    setMsg((m) => ({ ...m, [id]: "" }));
    try {
      const res = await fetch("/api/admin/data-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", provider: id }),
      });
      const json = await res.json();
      if (res.ok || json.result) {
        const r = json.result;
        setMsg((m) => ({
          ...m,
          [id]: r.enabled
            ? `Run ${r.ok ? "complete" : "finished with issues"} · received ${r.received}, created ${r.created}, updated ${r.updated}, published ${r.published}, archived ${r.archived}, rejected ${r.rejected}${r.ownerActionRequired ? ` · ${r.ownerActionRequired}` : ""}`
            : `Not enabled — ${r.ownerActionRequired || r.detail}`,
        }));
        // Refresh statuses.
        const s = await fetch("/api/admin/data-sync");
        if (s.ok) setCounties((await s.json()).counties);
      } else {
        setMsg((m) => ({ ...m, [id]: json.error || "Sync failed." }));
      }
    } catch {
      setMsg((m) => ({ ...m, [id]: "Network error." }));
    } finally {
      setBusy(null);
    }
  }

  const la = counties.find((c) => c.id === "la_county_recorder");

  return (
    <div className="flex flex-col gap-5">
      {counties.map((c) => (
        <Card key={c.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-semibold text-navy">
                  {c.county} County <span className="text-navy-muted">({c.state})</span>
                </h2>
                {c.eventSyncEnabled ? (
                  <Badge tone="positive">Event sync enabled</Badge>
                ) : (
                  <Badge tone="warn">Event sync disabled</Badge>
                )}
                {c.enrichmentConfigured ? <Badge tone="accent">Parcel enrichment configured</Badge> : <Badge>Enrichment not configured</Badge>}
              </div>
              <p className="mt-1 text-sm text-navy-muted">{c.label}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => test(c.id)} disabled={busy !== null}>
                {busy === `test:${c.id}` ? "Testing…" : "Test connection"}
              </Button>
              <Button size="sm" onClick={() => syncNow(c.id)} disabled={busy !== null}>
                {busy === `sync:${c.id}` ? "Syncing…" : "Sync now"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Next run" value={c.nextRun} />
            <Stat label="Last success" value={c.lastSuccessAt ? new Date(c.lastSuccessAt).toLocaleString("en-US") : "—"} />
            <Stat label="Last received" value={c.lastRun ? String(c.lastRun.received) : "—"} />
            <Stat label="Last published" value={c.lastRun ? String(c.lastRun.published) : "—"} />
          </div>

          {c.lastRun ? (
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Num label="Created" value={c.lastRun.created} />
              <Num label="Updated" value={c.lastRun.updated} />
              <Num label="Published" value={c.lastRun.published} tone="positive" />
              <Num label="Archived" value={c.lastRun.archived} />
              <Num label="Rejected" value={c.lastRun.rejected} tone={c.lastRun.rejected ? "warn" : undefined} />
              <Num label="Status" value={c.lastRun.status} />
            </div>
          ) : null}

          {c.ownerActionRequired ? (
            <p className="mt-3 rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-warn">
              Owner action required: {c.ownerActionRequired}
            </p>
          ) : null}

          {conn[c.id] ? (
            <p className={`mt-3 text-sm ${conn[c.id].ok ? "text-positive" : "text-warn"}`}>
              Connection: {conn[c.id].detail}
              {conn[c.id].blocker ? ` (blocker: ${conn[c.id].blocker})` : ""}
            </p>
          ) : null}
          {msg[c.id] ? <p className="mt-2 text-sm text-navy">{msg[c.id]}</p> : null}
        </Card>
      ))}

      {/* LA source-acquisition card (Section 11). */}
      {la ? (
        <Card className="border-accent/30 p-5">
          <h2 className="font-serif text-lg font-semibold text-navy">Los Angeles source acquisition</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatusLine label="Event feed" ok={la.eventSyncEnabled} okText="Connected" offText="Not connected" />
            <StatusLine label="Assessor enrichment" ok={la.enrichmentConfigured} okText="Connected" offText="Not connected" />
            <Stat label="Last feed file" value={la.lastRun?.correlationId ?? "—"} />
            <Stat label="Last successful event sync" value={la.lastSuccessAt ? new Date(la.lastSuccessAt).toLocaleString("en-US") : "—"} />
          </div>
          {la.lastRun ? (
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Num label="Received" value={la.lastRun.received} />
              <Num label="Created" value={la.lastRun.created} />
              <Num label="Updated" value={la.lastRun.updated} />
              <Num label="Rejected" value={la.lastRun.rejected} tone={la.lastRun.rejected ? "warn" : undefined} />
            </div>
          ) : null}
          {!la.eventSyncEnabled ? (
            <p className="mt-3 rounded-lg border border-warn/30 bg-canvas px-3 py-2 text-sm text-warn">
              {la.ownerActionRequired}
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-wide text-navy-muted">{label}</p>
      <p className="truncate text-sm font-semibold text-navy" title={value}>{value}</p>
    </div>
  );
}

function Num({ label, value, tone }: { label: string; value: number | string; tone?: "positive" | "warn" }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-wide text-navy-muted">{label}</p>
      <p className={`tnum text-base font-semibold ${tone === "positive" ? "text-positive" : tone === "warn" ? "text-warn" : "text-navy"}`}>{value}</p>
    </div>
  );
}

function StatusLine({ label, ok, okText, offText }: { label: string; ok: boolean; okText: string; offText: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-hairline bg-canvas px-3 py-2">
      <span className="text-sm text-navy-muted">{label}</span>
      <Badge tone={ok ? "positive" : "warn"}>{ok ? okText : offText}</Badge>
    </div>
  );
}
