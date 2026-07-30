import type { Metadata } from "next";
import { Shell, Kicker } from "@/components/ui";
import { FinancingForm } from "@/components/forms/FinancingForm";
import { FINANCING_TYPES, labelFor } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Financing",
  description:
    "Request an initial financing review — auction acquisition, bridge, fix-and-flip, rehabilitation, DSCR takeout, or private capital.",
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
    <Shell className="py-10">
      <div className="mx-auto max-w-2xl">
        <Kicker>Arrange the capital</Kicker>
        <h1 className="font-serif text-3xl font-semibold text-navy">{heading}</h1>
        <p className="mt-2 text-navy-muted">
          A short initial review — no full mortgage application at this stage. We collect only
          what&apos;s needed to evaluate the opportunity and reach back out.
        </p>

        {!type ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {FINANCING_TYPES.map((f) => (
              <a
                key={f.value}
                href={`/financing?type=${f.value}`}
                className="rounded-full border border-hairlineStrong bg-surface px-3.5 py-1.5 text-sm text-navy-soft hover:border-navy-muted"
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
