"use client";

import { useState } from "react";
import { Send, Check, ArrowRight } from "lucide-react";
import { COMPANY, telHref } from "@/lib/company";
import { SUITABILITY_NOTE } from "@/lib/trust-deed";

const input =
  "w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-[14px] text-white outline-none transition-colors placeholder:text-white/45 focus:border-white/35";
const select = `${input} appearance-none`;

const CAPITAL_RANGES = ["Under $50K", "$50K – $250K", "$250K – $1M", "$1M – $5M", "$5M+"];
const LIEN_PREF = ["1st position", "Either 1st or 2nd", "No preference"];
const TIMELINES = ["Ready now", "1–3 months", "Exploring / researching"];

export default function InvestorIntake() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    capitalRange: "",
    lienPreference: "",
    timeline: "",
    message: "",
  });
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /\S+@\S+\.\S+/.test(form.email);
  const canSend = !!form.name.trim() && emailValid && consent && !sending;

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/investor-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consentGiven: consent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not send your request.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-card bg-gradient-to-br from-navy to-navy-soft p-6 text-white shadow-lift sm:p-9">
      {done ? (
        <div className="flex items-start gap-3">
          <Check size={20} className="mt-0.5 shrink-0 text-emerald-300" />
          <div>
            <p className="text-[17px] font-semibold">Thank you — request received.</p>
            <p className="mt-1 text-[14px] leading-relaxed text-white/80">
              A representative from {COMPANY.legalName} will reach out with information. This is not
              an offer of securities or a commitment of any kind.
            </p>
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-[22px] font-semibold tracking-tight">Become a capital partner</h3>
          <p className="mt-2 text-[14.5px] leading-relaxed text-white/75">
            Request information about how our capital partners participate in conservatively
            underwritten California trust deeds. No obligation.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            <input className={input} type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            <input className={input} placeholder="Phone (optional)" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            <select className={select} value={form.capitalRange} onChange={(e) => set("capitalRange", e.target.value)}>
              <option value="" className="text-navy">Capital to deploy (optional)</option>
              {CAPITAL_RANGES.map((o) => (
                <option key={o} value={o} className="text-navy">{o}</option>
              ))}
            </select>
            <select className={select} value={form.lienPreference} onChange={(e) => set("lienPreference", e.target.value)}>
              <option value="" className="text-navy">Lien preference (optional)</option>
              {LIEN_PREF.map((o) => (
                <option key={o} value={o} className="text-navy">{o}</option>
              ))}
            </select>
            <select className={select} value={form.timeline} onChange={(e) => set("timeline", e.target.value)}>
              <option value="" className="text-navy">Timeline (optional)</option>
              {TIMELINES.map((o) => (
                <option key={o} value={o} className="text-navy">{o}</option>
              ))}
            </select>
          </div>
          <textarea
            className={`${input} mt-3 min-h-[84px] resize-y`}
            placeholder="Anything you'd like us to know (optional)"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
          />

          <label className="mt-4 flex items-start gap-2.5 text-[12.5px] leading-relaxed text-white/70">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            <span>
              I agree to be contacted by {COMPANY.legalName} about capital-partner opportunities.
              {" "}
              {SUITABILITY_NOTE}
            </span>
          </label>

          {error && <p className="mt-2 text-[13px] font-medium text-red-300">{error}</p>}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold transition-transform ${
                canSend ? "bg-gold text-navy hover:-translate-y-0.5" : "cursor-not-allowed bg-white/30 text-white/60"
              }`}
            >
              {sending ? "Sending…" : "Request information"}
              {sending ? <Send size={16} /> : <ArrowRight size={17} />}
            </button>
            <span className="text-[13px] text-white/60">
              or call{" "}
              <a href={telHref(COMPANY.phoneOffice)} className="font-medium text-white/85 hover:text-white">
                {COMPANY.phoneOffice}
              </a>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
