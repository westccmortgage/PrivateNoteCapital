"use client";

import { useState } from "react";
import { Button, Field, inputCls, Card, Badge } from "@/components/ui";
import { ADAPTERS } from "@/lib/adapters";

interface RejectedRow {
  index: number;
  reasons: string[];
  raw: Record<string, string>;
}
interface ValidateResult {
  headers: string[];
  received: number;
  valid: number;
  rejected: RejectedRow[];
  duplicateKeysInFile: string[];
  publicDisplayAllowed: boolean;
  preview: Record<string, unknown>[];
}

export function ImportWizard() {
  const [source, setSource] = useState(ADAPTERS[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [columnMap, setColumnMap] = useState("");
  const [validation, setValidation] = useState<ValidateResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [committed, setCommitted] = useState<string | null>(null);

  const adapter = ADAPTERS.find((a) => a.id === source)!;

  async function call(action: "validate" | "commit") {
    if (!file) {
      setErr("Choose a CSV file first.");
      return;
    }
    setErr(null);
    setBusy(true);
    if (action === "validate") setValidation(null);
    const fd = new FormData();
    fd.set("action", action);
    fd.set("source", source);
    fd.set("file", file);
    if (columnMap.trim()) fd.set("columnMap", columnMap.trim());
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || "Request failed.");
      } else if (action === "validate") {
        setValidation(json as ValidateResult);
      } else {
        setCommitted(`Imported: ${json.created} created, ${json.updated} updated, ${json.rejected} rejected. Records saved as "${json.status}".`);
        setValidation(null);
      }
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  function downloadRejected() {
    if (!validation?.rejected.length) return;
    const headers = validation.headers;
    const lines = [
      ["_reasons", ...headers].join(","),
      ...validation.rejected.map((r) =>
        [JSON.stringify(r.reasons.join("; ")), ...headers.map((h) => JSON.stringify(r.raw[h] ?? ""))].join(","),
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
          <Field label="Source">
            <select className={inputCls} value={source} onChange={(e) => { setSource(e.target.value); setValidation(null); }}>
              {ADAPTERS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </Field>
          <Field label="CSV file">
            <input type="file" accept=".csv,text/csv" className={inputCls} onChange={(e) => { setFile(e.target.files?.[0] ?? null); setValidation(null); }} />
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
            Default mapping for this source is applied automatically. To override, paste a JSON object of
            {" "}<code>{`{ "canonical_field": "CSV Header" }`}</code>. Example:
          </p>
          <pre className="mt-1 overflow-x-auto rounded bg-canvas p-2 text-xs">{JSON.stringify(adapter.defaultColumnMap, null, 2)}</pre>
          <textarea className={inputCls} rows={4} value={columnMap} onChange={(e) => setColumnMap(e.target.value)} placeholder='{"external_id":"CaseNumber"}' />
        </details>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => call("validate")} disabled={busy}>{busy ? "Working…" : "Validate & preview"}</Button>
          <Button variant="ghost" onClick={() => call("commit")} disabled={busy || !validation}>Confirm import</Button>
        </div>
        {err ? <p className="mt-3 text-sm text-warn">{err}</p> : null}
        {committed ? <p className="mt-3 text-sm text-positive">{committed}</p> : null}
      </Card>

      {validation ? (
        <Card className="p-5">
          <div className="flex flex-wrap gap-3 text-sm">
            <Stat label="Received" value={validation.received} />
            <Stat label="Valid" value={validation.valid} tone="positive" />
            <Stat label="Rejected" value={validation.rejected.length} tone={validation.rejected.length ? "warn" : undefined} />
            <Stat label="Duplicate keys in file" value={validation.duplicateKeysInFile.length} />
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
                      <th className="py-1 pr-3">external_id</th>
                      <th className="py-1 pr-3">address</th>
                      <th className="py-1 pr-3">state</th>
                      <th className="py-1 pr-3">auction</th>
                      <th className="py-1 pr-3">opening_bid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validation.preview.map((r, i) => (
                      <tr key={i} className="border-t border-hairline">
                        <td className="py-1 pr-3">{String(r.external_id ?? "")}</td>
                        <td className="py-1 pr-3">{String(r.address ?? "")}</td>
                        <td className="py-1 pr-3">{String(r.state ?? "")}</td>
                        <td className="py-1 pr-3">{String(r.current_auction_date ?? "")}</td>
                        <td className="py-1 pr-3">{String(r.opening_bid ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <p className="mt-4 text-xs text-navy-muted">
            Review the preview and rejected rows, then click <strong>Confirm import</strong> to upsert the
            valid rows by (source, external_id). Existing records update; new ones are created.
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
