import type { Metadata } from "next";
import { ShieldCheck, Landmark, ClipboardCheck, ArrowRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import { COMPANY, telHref } from "@/lib/company";
import { UNDERWRITING_GUIDELINES } from "@/lib/trust-deed";

export const metadata: Metadata = {
  title: "Company — PrivateNoteCapital",
  description:
    "About PrivateNoteCapital and West Coast Capital Mortgage Inc. — a conservative, licensed operator sourcing and underwriting California trust-deed opportunities for capital partners.",
};

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Conservative discipline",
    body: "Low loan-to-value, first-position priority, and a documented exit on every note before it reaches a partner.",
  },
  {
    icon: Landmark,
    title: "Real California collateral",
    body: "Every note is secured by a recorded deed of trust against real property in a market we know well.",
  },
  {
    icon: ClipboardCheck,
    title: "Licensed & reviewed",
    body: "Operated by a licensed mortgage company; each file is reviewed by professionals before it is presented.",
  },
];

export default function Company() {
  return (
    <PageShell
      eyebrow="Company"
      title="A conservative, licensed operator."
      intro={`PrivateNoteCapital is operated by ${COMPANY.legalName} (NMLS #${COMPANY.nmls}) — sourcing and underwriting California trust-deed opportunities for capital partners.`}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {PILLARS.map((p) => (
          <div key={p.title} className="glass-card rounded-card p-6 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/5 text-navy">
              <p.icon size={20} />
            </span>
            <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-navy">{p.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-navy-muted">{p.body}</p>
          </div>
        ))}
      </div>

      <section id="about" className="mt-10 scroll-mt-24">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
          About us
        </h2>
        <div className="glass-card mt-4 space-y-3 rounded-card p-6 shadow-soft sm:p-8">
          <p className="text-[15px] leading-relaxed text-navy-soft">
            PrivateNoteCapital exists to connect capital partners with real-estate-secured private
            mortgage notes in California, underwritten the way we would want our own capital handled —
            conservatively, in first position, and against a meaningful equity cushion.
          </p>
          <p className="text-[15px] leading-relaxed text-navy-soft">
            We source business-purpose borrowers, verify the collateral and title, and present
            partners with complete files. We never promise returns; we focus on discipline, real
            collateral, and clear communication.
          </p>
        </div>
      </section>

      <section id="underwriting" className="mt-10 scroll-mt-24">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
          How we underwrite
        </h2>
        <div className="glass-card mt-4 grid gap-4 rounded-card p-6 shadow-soft sm:grid-cols-2 sm:p-8">
          {UNDERWRITING_GUIDELINES.map((g) => (
            <div key={g.title}>
              <h3 className="text-[15.5px] font-semibold tracking-tight text-navy">{g.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-navy-muted">{g.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="compliance" className="mt-10 scroll-mt-24">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
          Compliance & licensing
        </h2>
        <div className="glass-card mt-4 space-y-3 rounded-card p-6 shadow-soft sm:p-8">
          <p className="text-[15px] leading-relaxed text-navy-soft">
            PrivateNoteCapital is informational and is not an offer of securities. Any opportunity,
            if and when available, is offered only through definitive documents and only where
            suitable and lawful. Trust-deed investments involve risk, including loss of principal;
            yields are not guaranteed.
          </p>
          <p className="text-[14px] leading-relaxed text-navy-muted">
            {COMPANY.legalName} · NMLS&nbsp;#{COMPANY.nmls} · {COMPANY.mailingAddress} ·{" "}
            <a href={telHref(COMPANY.phoneOffice)} className="font-medium text-navy hover:underline">
              {COMPANY.phoneOffice}
            </a>
            . Full detail on our{" "}
            <a href="/legal" className="font-medium text-navy hover:underline">
              Legal &amp; Disclosures
            </a>{" "}
            page; verify licensing at{" "}
            <a
              href="https://www.nmlsconsumeraccess.org/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-navy hover:underline"
            >
              NMLS Consumer Access
            </a>
            .
          </p>
        </div>
      </section>

      <div className="mt-8">
        <a
          href="/#request"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-[15px] font-medium text-white/95 transition-colors hover:bg-navy-soft"
        >
          Become a capital partner <ArrowRight size={17} />
        </a>
      </div>
    </PageShell>
  );
}
