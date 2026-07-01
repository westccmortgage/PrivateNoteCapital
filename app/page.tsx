"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Landmark,
  ScrollText,
  Layers,
  CheckCircle2,
  Building2,
  ClipboardCheck,
  Handshake,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ComplianceNotice from "@/components/ComplianceNotice";
import AvatarHero from "@/components/AvatarHero";
import FeatureStrip from "@/components/FeatureStrip";
import YieldIllustrator from "@/components/YieldIllustrator";
import InvestorIntake from "@/components/InvestorIntake";
import { UNDERWRITING_GUIDELINES, PARTNER_DELIVERABLES } from "@/lib/trust-deed";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="scroll-mt-20 py-14 sm:py-20"
    >
      <span className="inline-block rounded-full border border-hairline bg-white/60 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
        {eyebrow}
      </span>
      <h2 className="mt-4 max-w-2xl font-serif text-balance text-[28px] font-medium leading-[1.12] tracking-tight text-navy sm:text-[38px]">
        {title}
      </h2>
      {intro && <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-navy-muted">{intro}</p>}
      <div className="mt-8">{children}</div>
    </motion.section>
  );
}

const HOW_STEPS = [
  {
    icon: ScrollText,
    title: "A note secured by real estate",
    body: "You participate in a private mortgage note secured by a recorded deed of trust against California real property — a senior, tangible claim, not a paper promise.",
  },
  {
    icon: ShieldCheck,
    title: "Underwritten conservatively",
    body: "We emphasize low loan-to-value and first position, so a meaningful equity cushion sits beneath the note before any capital is placed.",
  },
  {
    icon: Landmark,
    title: "Interest paid over the term",
    body: "Private notes are typically interest-only, with principal returned at payoff. Terms, rate, and how interest is paid are disclosed for every opportunity.",
  },
];

const PROTECTIONS = [
  { icon: Layers, title: "Equity cushion", body: "Conservative LTV means the property value sits well above the loan — a buffer against market movement." },
  { icon: Building2, title: "Recorded collateral", body: "Every note is secured by a recorded deed of trust against real California property, with title and insurance verified." },
  { icon: ClipboardCheck, title: "Independent review", body: "Valuation is independently supported and each file is reviewed by licensed professionals before it reaches a partner." },
];

const PROCESS = [
  { n: "01", title: "Introduce yourself", body: "Tell us how you would like to participate. No obligation, and nothing is an offer." },
  { n: "02", title: "Review opportunities", body: "When a note fits, you receive the property, valuation, lien position, LTV, term, and documented exit." },
  { n: "03", title: "Fund what fits you", body: "You choose which notes to participate in. Funds are placed against recorded, real-estate-secured collateral." },
  { n: "04", title: "Receive interest", body: "Interest is paid over the term per the note; principal is returned at payoff. Outcomes are never guaranteed." },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <AvatarHero />
      <FeatureStrip />

      <main className="mx-auto max-w-engine px-5 sm:px-8">
        {/* How it works */}
        <Section
          id="how-it-works"
          eyebrow="How it works"
          title="Trust-deed investing, done conservatively."
          intro="Private mortgage notes let you place capital behind real estate you can see — secured, senior, and underwritten to a cushion."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {HOW_STEPS.map((s) => (
              <div key={s.title} className="glass-card rounded-card p-6 shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/5 text-navy">
                  <s.icon size={20} />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-navy">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-navy-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Deal flow */}
        <Section
          id="deal-flow"
          eyebrow="Deal flow"
          title="Good clients, real collateral, complete files."
          intro="We source business-purpose California real estate borrowers and present partners with everything needed to evaluate a note."
        >
          <div className="glass-card rounded-card p-6 shadow-soft sm:p-8">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
              With each opportunity you receive
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {PARTNER_DELIVERABLES.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-navy-soft">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-gold" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Guidelines */}
        <Section
          id="guidelines"
          eyebrow="Our guidelines"
          title="Conservative by design."
          intro="These are the disciplines we underwrite to. They shape every note before it is ever presented to a capital partner."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {UNDERWRITING_GUIDELINES.map((g) => (
              <div key={g.title} className="glass-card rounded-card p-6 shadow-soft">
                <h3 className="text-[16px] font-semibold tracking-tight text-navy">{g.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-navy-muted">{g.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Protection */}
        <Section
          id="protection"
          eyebrow="Capital protection"
          title="Structured to protect principal — never to guarantee it."
          intro="No investment is risk-free. What we can do is underwrite conservatively and secure every note against recorded California real estate."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {PROTECTIONS.map((p) => (
              <div key={p.title} className="glass-card rounded-card p-6 shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/12 text-gold">
                  <p.icon size={20} />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-navy">{p.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-navy-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Yield Illustrator */}
        <Section
          id="illustrator"
          eyebrow="Yield illustrator"
          title="See how interest-only income works."
          intro="A neutral arithmetic illustration — move the inputs to see interest-only income at those numbers. It is not a quote, an offer, or a promise of any return."
        >
          <YieldIllustrator />
        </Section>

        {/* Process */}
        <Section
          id="process"
          eyebrow="The process"
          title="From introduction to interest."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((s) => (
              <div key={s.n} className="glass-card rounded-card p-6 shadow-soft">
                <span className="text-[13px] font-semibold text-gold">{s.n}</span>
                <h3 className="mt-2 text-[15.5px] font-semibold tracking-tight text-navy">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-navy-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Request / intake */}
        <Section
          id="request"
          eyebrow="Become a capital partner"
          title="Let us send you information."
          intro="Tell us how you would like to participate and a representative will follow up. No obligation — and nothing here is an offer of securities."
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <InvestorIntake />
            <div className="glass-card rounded-card p-6 shadow-soft sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/5 text-navy">
                <Handshake size={20} />
              </span>
              <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-navy">
                Why partners work with us
              </h3>
              <ul className="mt-3 space-y-2.5">
                {[
                  "A licensed operator with a disciplined, conservative process",
                  "First-position, real-estate-secured California notes",
                  "Complete files — you see the collateral, LTV, and exit",
                  "Straightforward communication, no pressure",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-navy-soft">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ComplianceNotice />
        </Section>
      </main>

      <Footer />
    </div>
  );
}
