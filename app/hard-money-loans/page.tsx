import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Shell } from "@/components/ui";
import { QuickTermsForm } from "@/components/forms/QuickTermsForm";
import { PROGRAMS, HOME_FAQ } from "@/lib/hard-money";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hard Money Loans: Fix and Flip, Construction, Bridge, DSCR",
  description:
    "Hard money loans for investors: up to 90% of the purchase and 100% of the rehab, ground-up construction, bridge and 30-year DSCR rental loans from $50,000 to $3 million.",
  alternates: { canonical: `${SITE.url}/hard-money-loans` },
};

const PHOTOS: Record<string, { src: string; alt: string }> = {
  "fix-and-flip": { src: "/images/rehab-scaffold.webp", alt: "Wood-frame house in scaffolding during a renovation" },
  construction: { src: "/images/neighborhood-aerial.webp", alt: "Aerial view of houses on residential lots" },
  bridge: { src: "/images/hero-house.webp", alt: "Finished two-story house ready to sell" },
  dscr: { src: "/images/street-oaks.webp", alt: "Residential street lined with oak trees" },
};

export default function HardMoneyLoansPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <section className="bg-field text-white">
        <Shell className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <h1 className="font-serif text-[42px] font-black leading-[0.98] tracking-display sm:text-[64px]">
              Hard money loans
            </h1>
            <p className="mt-5 max-w-xl text-[19px] leading-relaxed text-white/90">
              Short-term money to buy, renovate or build, and a 30-year rental loan for when you decide to keep the
              property. Every loan closes in your LLC and is sized on the deal.
            </p>
            <nav className="mt-8 flex flex-wrap gap-2" aria-label="Loan programs">
              {PROGRAMS.map((p) => (
                <a
                  key={p.id}
                  href={`#${p.id}`}
                  className="rounded-md border-2 border-white/60 px-4 py-2 text-[15px] font-bold hover:border-signal hover:text-signal"
                >
                  {p.name}
                </a>
              ))}
            </nav>
          </div>
          <QuickTermsForm compact />
        </Shell>
      </section>

      {PROGRAMS.map((p, i) => (
        <section key={p.id} id={p.id} className={`scroll-mt-20 py-16 sm:py-24 ${i % 2 ? "bg-canvas" : "bg-white"}`}>
          <Shell className="grid gap-12 lg:grid-cols-2">
            <div className={i % 2 ? "lg:order-2" : ""}>
              <h2 className="font-serif text-[34px] font-extrabold leading-[1.05] tracking-display sm:text-[46px]">{p.name} loans</h2>
              <p className="mt-2 text-[18px] font-bold text-accent">{p.max}</p>
              <p className="mt-5 text-[17px] leading-relaxed text-navy-soft">{p.intro}</p>
              <ul className="mt-6 space-y-3">
                {p.notes.map((n) => (
                  <li key={n} className="flex gap-3 text-[16px] leading-relaxed text-navy-soft">
                    <span className="mt-[9px] h-2 w-2 shrink-0 rounded-sm bg-signal" aria-hidden="true" />
                    {n}
                  </li>
                ))}
              </ul>
              <Link
                href={`/financing?type=${p.financingType}`}
                className="mt-8 inline-flex items-center gap-2 rounded-md bg-field px-6 py-3.5 font-bold text-white hover:bg-field-deep"
              >
                Get terms for a {p.name.toLowerCase()} loan <ArrowRight size={18} />
              </Link>
            </div>
            <div>
              <div className="relative aspect-[16/9] overflow-hidden rounded-card">
                <Image src={PHOTOS[p.id].src} alt={PHOTOS[p.id].alt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              </div>
              <dl className="mt-6 divide-y divide-hairline border-y-2 border-navy">
                {p.terms.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[1fr_1.1fr] sm:gap-6">
                    <dt className="text-[15px] text-navy-muted">{k}</dt>
                    <dd className="text-[16px] font-bold text-navy">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Shell>
        </section>
      ))}

      <section className="bg-white py-16 sm:py-24">
        <Shell className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="font-serif text-[34px] font-extrabold leading-[1.05] tracking-display sm:text-[44px]">
            Before you apply
          </h2>
          <div className="divide-y divide-hairlineStrong border-y border-hairlineStrong">
            {HOME_FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[18px] font-bold text-navy">
                  {q}
                  <span className="mt-1 text-[22px] leading-none text-accent transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-navy-soft">{a}</p>
              </details>
            ))}
          </div>
        </Shell>
      </section>

      <section className="bg-canvas pb-20">
        <Shell>
          <p className="max-w-3xl text-[14px] leading-relaxed text-navy-muted">
            Program maximums for non-owner-occupied 1 to 4 unit investment property, as of November 2026. Not an offer
            or a commitment to lend. Availability and limits vary by state and county.
          </p>
        </Shell>
      </section>
    </>
  );
}
