import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Shell } from "@/components/ui";
import { PropertyCard } from "@/components/search/PropertyCard";
import { QuickTermsForm } from "@/components/forms/QuickTermsForm";
import { getHomeSections } from "@/lib/opportunities";
import { PROGRAMS, HOME_FAQ } from "@/lib/hard-money";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sections = await getHomeSections();

  return (
    <>
      {/* Hero: full-bleed photo, the offer, and the working lead form */}
      <section className="relative isolate overflow-hidden bg-field text-white">
        <Image
          src="/images/hero-house.webp"
          alt="Two-story house with a palm tree in the front yard"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[50%_40%]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-field-deep/90 via-field/75 to-field-deep/95" />
        <Shell className="pb-14 pt-16 sm:pb-20 sm:pt-24">
          <h1 className="max-w-4xl font-serif text-[44px] font-black leading-[0.98] tracking-display sm:text-[68px] lg:text-[80px]">
            Hard money loans for <span className="text-signal">real estate investors</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[19px] leading-relaxed text-white/90 sm:text-[21px]">
            Up to 90% of the purchase price and the full rehab budget, on loans from $50,000 to $3 million.
            Send us the property and we will come back with terms before you pay for an appraisal.
          </p>
          <div className="mt-9 max-w-5xl">
            <QuickTermsForm />
          </div>
        </Shell>
      </section>

      {/* Programs as a table: what each loan pays for and how far it goes */}
      <section className="bg-white py-16 sm:py-24">
        <Shell>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-2xl font-serif text-[34px] font-extrabold leading-[1.05] tracking-display sm:text-[48px]">
              Pick the loan by what you are doing with the property
            </h2>
            <Link href="/hard-money-loans" className="inline-flex items-center gap-2 text-[16px] font-bold text-accent hover:underline">
              All loan terms <ArrowRight size={18} />
            </Link>
          </div>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-navy text-[14px] font-bold text-navy-muted">
                  <th className="py-3 pr-6 font-bold">Loan</th>
                  <th className="py-3 pr-6 font-bold">What it pays for</th>
                  <th className="py-3 pr-6 font-bold">How much</th>
                  <th className="py-3 font-bold">Term</th>
                </tr>
              </thead>
              <tbody>
                {PROGRAMS.map((p) => (
                  <tr key={p.id} className="group border-b border-hairline align-top">
                    <th scope="row" className="py-6 pr-6">
                      <Link
                        href={`/hard-money-loans#${p.id}`}
                        className="font-serif text-[22px] font-extrabold tracking-display text-navy group-hover:text-accent"
                      >
                        {p.name}
                      </Link>
                    </th>
                    <td className="py-6 pr-6 text-[16px] text-navy-soft">{p.use}</td>
                    <td className="py-6 pr-6 text-[16px] font-bold text-navy tnum">{p.max}</td>
                    <td className="py-6 text-[16px] text-navy-soft">{p.term}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-[14px] text-navy-muted">
            Program maximums for non-owner-occupied 1 to 4 unit property. Your terms depend on credit, experience and the
            appraisal.
          </p>
        </Shell>
      </section>

      {/* How a loan gets done: a real sequence, so the numbers carry information */}
      <section className="bg-canvas py-16 sm:py-24">
        <Shell className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[7/5] overflow-hidden rounded-card">
            <Image
              src="/images/rehab-scaffold.webp"
              alt="White wood-frame house wrapped in scaffolding during a renovation"
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif text-[34px] font-extrabold leading-[1.05] tracking-display sm:text-[44px]">
              From the first call to the wire
            </h2>
            <ol className="mt-8 space-y-7">
              {[
                ["Send the deal", "Address, price, rehab or build budget, and what the house is worth when the work is done."],
                ["See where it lands", "We tell you which loan fits and roughly how much it covers. If the numbers do not work, you hear that first."],
                ["Get a term sheet", "A soft credit pull, then written terms. The appraisal is ordered after you accept them."],
                ["Close in your LLC", "Money goes to escrow at closing. Rehab and construction funds come out in draws as the work is inspected."],
              ].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[48px_1fr] gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-md bg-field font-serif text-[22px] font-black text-signal">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-[19px] font-bold text-navy">{t}</h3>
                    <p className="mt-1 text-[16px] leading-relaxed text-navy-soft">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Shell>
      </section>

      {/* Records, only when real ones exist */}
      {sections.length > 0
        ? sections.map((s) => (
            <section key={s.key} className="bg-white py-12">
              <Shell>
                <div className="mb-5 flex items-end justify-between">
                  <h2 className="font-serif text-[28px] font-extrabold tracking-display">{s.title}</h2>
                  <Link href="/search" className="inline-flex items-center gap-2 font-bold text-accent hover:underline">
                    View all <ArrowRight size={18} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {s.rows.map((p) => (
                    <PropertyCard key={p.id} p={p} />
                  ))}
                </div>
              </Shell>
            </section>
          ))
        : null}

      {/* Where to find the deal: Florida auction research and California listings */}
      <section className="relative isolate overflow-hidden bg-field py-16 text-white sm:py-24">
        <Image
          src="/images/neighborhood-aerial.webp"
          alt="Aerial view of houses and streets in a residential neighborhood"
          fill
          sizes="100vw"
          className="-z-10 object-cover opacity-25"
        />
        <Shell>
          <h2 className="max-w-3xl font-serif text-[34px] font-extrabold leading-[1.05] tracking-display sm:text-[48px]">
            Still looking for the property?
          </h2>
          <div className="mt-10 grid gap-10 border-t border-field-line pt-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h3 className="font-serif text-[26px] font-extrabold tracking-display text-signal">Florida foreclosure auctions</h3>
              <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-field-text">
                Clerk auction calendars for Palm Beach, Broward, Miami-Dade, Hillsborough, Orange and Duval, with the
                rules for each county. Set up a weekly watchlist and we email you when matching sales are added.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/florida/foreclosure-auctions" className="rounded-md bg-signal px-6 py-3.5 font-bold text-signal-ink hover:bg-signal-hover">
                  Florida auction calendars
                </Link>
                <Link href="/search" className="rounded-md border-2 border-white/70 px-6 py-3 font-bold text-white hover:bg-white hover:text-navy">
                  Search records
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-serif text-[26px] font-extrabold tracking-display text-signal">California investor listings</h3>
              <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-field-text">
                Properties for sale through our brokerage marketplace, each linked to its original listing. Found one?
                Ask for purchase financing on the same page.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/california/investor-opportunities" className="rounded-md bg-signal px-6 py-3.5 font-bold text-signal-ink hover:bg-signal-hover">
                  California listings
                </Link>
                <Link href="/watchlist" className="rounded-md border-2 border-white/70 px-6 py-3 font-bold text-white hover:bg-white hover:text-navy">
                  Weekly watchlist
                </Link>
              </div>
            </div>
          </div>
        </Shell>
      </section>

      {/* Private debt: the other side of the same business */}
      <section className="bg-white py-16 sm:py-20">
        <Shell className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <h2 className="font-serif text-[30px] font-extrabold leading-[1.08] tracking-display sm:text-[40px]">
              Want to lend instead of borrow?
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-navy-soft">
              Our private debt program places capital in California trust deeds secured by real estate. Read how the
              process works and what the risks are before you ask us anything. Asking is not a commitment, and returns
              are never guaranteed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/private-debt" className="rounded-md bg-field px-6 py-3.5 font-bold text-white hover:bg-field-deep">
              How private debt works
            </Link>
            <Link href="/private-debt/faq" className="rounded-md border-2 border-navy px-6 py-3 font-bold text-navy hover:bg-navy hover:text-white">
              Risks and questions
            </Link>
          </div>
        </Shell>
      </section>

      {/* Questions investors actually ask */}
      <section className="bg-canvas py-16 sm:py-24">
        <Shell className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="font-serif text-[34px] font-extrabold leading-[1.05] tracking-display sm:text-[44px]">
            Hard money questions
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

      {/* Close */}
      <section className="relative isolate overflow-hidden bg-field py-20 text-white sm:py-28">
        <Image
          src="/images/keys-closing.webp"
          alt="A hand holding a set of house keys"
          fill
          sizes="100vw"
          className="-z-10 object-cover object-[70%_50%] opacity-35"
        />
        <Shell>
          <h2 className="max-w-3xl font-serif text-[38px] font-black leading-[1.02] tracking-display sm:text-[60px]">
            Have a property under contract?
          </h2>
          <p className="mt-5 max-w-xl text-[19px] text-white/90">
            Send it today. You will know what the loan covers before you spend money on the appraisal.
          </p>
          <Link href="/financing" className="mt-8 inline-flex items-center gap-2 rounded-md bg-signal px-8 py-4 text-[17px] font-bold text-signal-ink hover:bg-signal-hover">
            Get terms on my deal <ArrowRight size={20} />
          </Link>
        </Shell>
      </section>
    </>
  );
}
