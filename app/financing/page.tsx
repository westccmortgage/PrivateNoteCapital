import type { Metadata } from "next";
import { Shell, Kicker } from "@/components/ui";
import { FinancingForm } from "@/components/forms/FinancingForm";
import { FINANCING_TYPES, labelFor } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: "/financing" },
  title: "Financing",
  description:
    "Request terms on a hard money loan: fix and flip, construction, bridge, DSCR rental, or a refinance after an auction purchase.",
};

export default async function FinancingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams; // Next 15: searchParams is async
  const type = sp.type;
  const isReview = sp.intent === "review";
  const heading = isReview
    ? "Request a deal review"
    : type
      ? `${labelFor(FINANCING_TYPES, type)} request`
      : "Request financing";

  return (
    <Shell className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Kicker>Arrange the capital</Kicker>
        <h1 className="font-serif text-[38px] font-black leading-[1.02] tracking-display text-navy sm:text-[48px]">{heading}</h1>
        <p className="mt-3 text-[17px] text-navy-soft">
          This is not a loan application. Tell us about the property and we will call you with the loan that fits
          and roughly how much it covers.
        </p>

        {!type ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {FINANCING_TYPES.map((f) => (
              <a
                key={f.value}
                href={`/financing?type=${f.value}${sp.state ? `&state=${encodeURIComponent(sp.state)}` : ""}`}
                className="rounded-md border-2 border-hairlineStrong bg-surface px-4 py-2 text-[15px] font-semibold text-navy hover:border-navy"
              >
                {f.label}
              </a>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          <FinancingForm
            initial={{
              financingType: type,
              propertyId: sp.propertyId,
              propertyAddress: sp.propertyAddress,
              state: sp.state,
              county: sp.county,
              intent: sp.intent,
            }}
          />
        </div>
      </div>
    </Shell>
  );
}
