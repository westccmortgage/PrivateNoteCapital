"use client";

import { useState } from "react";
import { Button, Field, inputCls, Card, Badge } from "@/components/ui";
import { ADAPTERS } from "@/lib/adapters";
import { neutralizeFormula } from "@/lib/csv";

interface RejectedRow {
  index: number;
  reasons: string[];
  raw: Record<string, string>;
}
interface PreviewRow {
  external_id?: string;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  state?: string;
  current_auction_date?: string | null;
  opening_bid?: number | null;
  foreclosure_stage?: string | null;
  record_status?: string;
  eligible?: boolean;
  eligibility_reasons?: string[];
}
interface ValidateResult {
  headers: string[];
  received: number;
  valid: number;
  publishable: number;
  draft: number;
  archived: number;
  rejected: RejectedRow[];
  duplicateKeysInFile: string[];
  publicDisplayAllowed: boolean;
  preview: PreviewRow[];
}
interface CommitResult {
  received: number;
  accepted: number;
  created: number;
  updated: number;
  duplicates: number;
  rejected: number;
  published: number;
  draft: number;
  archived: number;
  withdrawn: number;
  richFieldsWritten: boolean;
}

export function ImportWizard() {
  const [source, setSource] = useState(ADAPTERS[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [columnMap, setColumnMap] = useState("");
  const [withdrawStale, setWithdrawStale] = useState(false);
  const [validation, setValidation] = useState<ValidateResult | null>(null);
  const [commit, setCommit] = useState<CommitResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  const adapter = ADAPTERS.find((a) => a.id === source)!;

  async function call(action: "validate" | "commit") {
    if (!file) {
      setErr("Choose a CSV file first.");
      return;
    }
    setErr(null);
    setPublishMsg(null);
    setBusy(true);
    if (action === "validate") { setValidation(null); setCommit(null); }
    const fd = new FormData();
    fd.set("action", action);
    fd.set("source", source);
    fd.set("file", file);
    if (columnMap.trim()) fd.set("columnMap", columnMap.trim());
    if (action === "commit" && withdrawStale) fd.set("withdrawStale", "true");
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) setErr(json.error || "Request failed.");
      else if (action === "validate") setValidation(json as ValidateResult);
      else { setCommit(json as CommitResult); setValidation(null); }
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function publishEligible() {
    setBusy(true);
    setPublishMsg(null);
    const fd = new FormData();
    fd.set("action", "publish_eligible");
    fd.set("source", source);
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const json = await res.json();
      setPublishMsg(res.ok ? `Published ${json.published} eligible draft record(s).` : json.error || "Publish failed.");
    } catch {
      setPublishMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  function downloadRejected() {
    if (!validation?.rejected.length) return;
    const headers = validation.headers;
    const cell = (v: string) => JSON.stringify(neutralizeFormula(v) ?? "");
    const lines = [
      ["_reasons", ...headers].join(","),
      ...validation.rejected.map((r) =>
        [cell(r.reasons.join("; ")), ...headers.map((h) => cell(r.raw[h] ?? ""))].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rejected-rows.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Source profile">
            <select className={inputCls} value={source} onChange={(e) => { setSource(e.target.value); setValidation(null); setCommit(null); }}>
              {ADAPTERS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </Field>
          <Field label="CSV file">
            <input type="file" accept=".csv,text/csv" className={inputCls} onChange={(e) => { setFile(e.target.files?.[0] ?? null); setValidation(null); setCommit(null); }} />
          </Field>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm">
          {adapter.publicDisplayAllowed ? (
            <Badge tone="positive">Public display allowed</Badge>
          ) : (
            <Badge tone="warn">Imports as draft (not public)</Badge>
          )}
          <span className="text-navy-muted">{adapter.note}</span>
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold text-accent">Column mapping (advanced)</summary>
          <p className="mt-2 text-xs text-navy-muted">
            The source profile is applied automatically. To override, paste a JSON object of
            {" "}<code>{`{ "canonical_field": "CSV Header" }`}</code>:
          </p>
          <pre className="mt-1 max-h-48 overflow-auto rounded bg-canvas p-2 text-xs">{JSON.stringify(adapter.defaultColumnMap, null, 2)}</pre>
          <textarea className={inputCls} rows={4} value={columnMap} onChange={(e) => setColumnMap(e.target.value)} placeholder='{"external_id":"CaseNumber"}' />
        </details>

        <label className="mt-3 flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" checked={withdrawStale} onChange={(e) => setWithdrawStale(e.target.checked)} />
          Withdraw published records from this source that are <strong>not</strong> in this file (archive, never delete)
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => call("validate")} disabled={busy}>{busy ? "Working…" : "Validate & preview"}</Button>
          <Button variant="ghost" onClick={() => call("commit")} disabled={busy || !validation}>Confirm import</Button>
          <Button variant="ghost" onClick={publishEligible} disabled={busy}>Publish eligible drafts</Button>
        </div>
        {err ? <p className="mt-3 text-sm text-warn">{err}</p> : null}
        {publishMsg ? <p className="mt-3 text-sm text-positive">{publishMsg}</p> : null}
      </Card>

      {/* Commit summary */}
      {commit ? (
        <Card className="p-5">
          <p className="font-serif text-lg font-semibold text-navy">Import complete</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Stat label="Received" value={commit.received} />
            <Stat label="Accepted" value={commit.accepted} tone="positive" />
            <Stat label="Created" value={commit.created} />
            <Stat label="Updated" value={commit.updated} />
            <Stat label="Duplicates merged" value={commit.duplicates} />
            <Stat label="Published" value={commit.published} tone="positive" />
            <Stat label="Draft" value={commit.draft} />
            <Stat label="Archived" value={commit.archived} />
            <Stat label="Withdrawn" value={commit.withdrawn} />
            <Stat label="Rejected" value={commit.rejected} tone={commit.rejected ? "warn" : undefined} />
          </div>
          {!commit.richFieldsWritten ? (
            <p className="mt-3 text-xs text-navy-muted">
              Rich fields (trustee, case #, lat/long, …) were skipped because migration
              <code> 0004_property_rich_fields.sql</code> isn&apos;t applied yet. Core fields imported fine.
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* Validation preview */}
      {validation ? (
        <Card className="p-5">
          <div className="flex flex-wrap gap-3 text-sm">
            <Stat label="Received" value={validation.received} />
            <Stat label="Valid" value={validation.valid} tone="positive" />
            <Stat label="Publishable" value={validation.publishable} tone="positive" />
            <Stat label="Draft" value={validation.draft} />
            <Stat label="Archived" value={validation.archived} />
            <Stat label="Rejected" value={validation.rejected.length} tone={validation.rejected.length ? "warn" : undefined} />
            <Stat label="Dup keys" value={validation.duplicateKeysInFile.length} />
          </div>

          {validation.rejected.length ? (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-navy">Rejected rows</p>
                <button onClick={downloadRejected} className="text-sm font-semibold text-accent hover:underline">Download rejected CSV</button>
              </div>
              <ul className="mt-2 max-h-56 overflow-y-auto text-sm">
                {validation.rejected.slice(0, 50).map((r) => (
                  <li key={r.index} className="border-b border-hairline py-1.5 text-navy-muted">
                    <span className="font-mono text-xs">row {r.index + 2}</span> — {r.reasons.join("; ")}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm text-positive">All rows passed validation.</p>
          )}

          {validation.preview.length ? (
            <div className="mt-4">
              <p className="font-semibold text-navy">Preview (first {validation.preview.length})</p>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-navy-muted">
                      <th className="py-1 pr-3">address</th>
                      <th className="py-1 pr-3">county</th>
                      <th className="py-1 pr-3">state</th>
                      <th className="py-1 pr-3">stage</th>
                      <th className="py-1 pr-3">auction</th>
                      <th className="py-1 pr-3">status</th>
                      <th className="py-1 pr-3">why not published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validation.preview.map((r, i) => (
                      <tr key={i} className="border-t border-hairline align-top">
                        <td className="py-1 pr-3">{r.address ?? "—"}</td>
                        <td className="py-1 pr-3">{r.county ?? "—"}</td>
                        <td className="py-1 pr-3">{r.state ?? "—"}</td>
                        <td className="py-1 pr-3">{r.foreclosure_stage ?? "—"}</td>
                        <td className="py-1 pr-3">{r.current_auction_date ?? "—"}</td>
                        <td className="py-1 pr-3">
                          <span className={r.record_status === "published" ? "text-positive" : "text-warn"}>{r.record_status}</span>
                        </td>
                        <td className="py-1 pr-3 text-navy-muted">{(r.eligibility_reasons ?? []).join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <p className="mt-4 text-xs text-navy-muted">
            Click <strong>Confirm import</strong> to upsert by (source, external_id): existing records
            update in place (saved &amp; inquiry links preserved), new ones are created. Eligible records
            publish automatically; the rest stay draft.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "positive" | "warn" }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-wide text-navy-muted">{label}</p>
      <p className={`tnum text-lg font-semibold ${tone === "positive" ? "text-positive" : tone === "warn" ? "text-warn" : "text-navy"}`}>{value}</p>
    </div>
  );
}
