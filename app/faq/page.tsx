import type { Metadata } from "next";
import { Plus } from "lucide-react";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "FAQ — PrivateNoteCapital",
  description:
    "Answers for capital partners about trust-deed investing with PrivateNoteCapital: what a note is, how we underwrite, risk, process, and how to participate.",
};

interface Group {
  title: string;
  items: Array<[string, string]>;
}

const GROUPS: Group[] = [
  {
    title: "The basics",
    items: [
      [
        "What is PrivateNoteCapital?",
        "A brand operated by West Coast Capital Mortgage that connects capital partners with conservatively underwritten private mortgage notes (trust deeds) secured by California real estate.",
      ],
      [
        "What is a trust-deed investment?",
        "You participate in a private mortgage loan secured by a recorded deed of trust against real property. It is a senior, tangible claim on real estate, typically interest-only, with principal returned at payoff.",
      ],
      [
        "Is this an offer to invest?",
        "No. This website is informational only and is not an offer to sell or a solicitation to buy any security or investment. Any opportunity, if and when available, is offered only through definitive documents and only where suitable and lawful.",
      ],
      [
        "Are returns guaranteed?",
        "No. Yields are never guaranteed. Trust-deed investments carry risk, including the possible loss of principal and income. Conservative underwriting reduces risk; it does not remove it.",
      ],
    ],
  },
  {
    title: "How we underwrite",
    items: [
      [
        "How conservative is the loan-to-value?",
        "We target low loan-to-value — generally up to about 65% on a 1st deed of trust, often lower — so a meaningful equity cushion sits beneath every note.",
      ],
      [
        "Do you focus on first position?",
        "Yes. We emphasize 1st-position deeds of trust — the senior, first-to-be-repaid claim. Subordinate positions are considered only selectively and underwritten to combined leverage.",
      ],
      [
        "What kind of loans are these?",
        "We concentrate on business-purpose / investment-property lending secured by California real estate, which is generally better suited to private capital.",
      ],
      [
        "What do I receive for each opportunity?",
        "The property and an independent valuation, the loan amount and lien position, loan-to-value, a business-purpose summary and documented exit, and title, insurance, and recorded deed-of-trust details.",
      ],
    ],
  },
  {
    title: "Participating",
    items: [
      [
        "Who can participate?",
        "Suitability is determined in accordance with applicable law during the process. Requesting information places you under no obligation and is not an agreement to invest.",
      ],
      [
        "How do I start?",
        "Use the request form or call us. A representative will follow up with information. Nothing is committed until you review definitive documents and decide.",
      ],
      [
        "How is my information handled?",
        "It is used to respond to you and, where appropriate, to share relevant opportunities. We do not sell your personal information. See Legal & Disclosures for details, including California rights.",
      ],
      [
        "What does the Yield Illustrator show?",
        "It is a neutral arithmetic example of interest-only income at the inputs you choose. It is not a quote, an offer, a projection, or a promise of any return.",
      ],
    ],
  },
];

export default function Faq() {
  return (
    <PageShell
      eyebrow="FAQ"
      title="Questions, answered."
      intro="The essentials for capital partners — what trust-deed investing is, how we underwrite, and how to participate."
    >
      <div className="space-y-8">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-navy-muted">
              {g.title}
            </h2>
            <div className="glass-card divide-y divide-hairline rounded-card p-2 shadow-soft">
              {g.items.map(([q, a]) => (
                <details key={q} className="group p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold tracking-tight text-navy">
                    {q}
                    <Plus
                      size={18}
                      className="shrink-0 text-navy/40 transition-transform group-open:rotate-45"
                    />
                  </summary>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-navy-muted">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
