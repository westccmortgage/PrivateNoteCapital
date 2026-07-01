import { Layers, Eye, Lock } from "lucide-react";

const FEATURES = [
  {
    icon: Layers,
    title: "Structured Opportunities",
    body: "Access a curated pipeline of real estate-backed notes underwritten with discipline and aligned with investor objectives.",
  },
  {
    icon: Eye,
    title: "Collateral Visibility",
    body: "See the collateral that supports each opportunity, with transparency into position, lien, and LTV before you invest.",
  },
  {
    icon: Lock,
    title: "Capital Control",
    body: "You decide where, when, and how to deploy. We give you the control and information to invest with confidence.",
  },
];

export default function FeatureStrip() {
  return (
    <section className="border-b border-hairline bg-white">
      <div className="mx-auto grid max-w-engine gap-10 px-5 py-14 sm:px-8 sm:py-16 md:grid-cols-3 md:gap-0">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`text-center md:px-8 ${i > 0 ? "md:border-l md:border-hairline" : ""}`}
          >
            <f.icon size={28} strokeWidth={1.5} className="mx-auto text-gold" />
            <h3 className="mt-4 font-serif text-[21px] font-medium tracking-tight text-navy">
              {f.title}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-navy-muted">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
