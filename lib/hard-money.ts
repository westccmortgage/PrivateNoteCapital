// Hard money programs shown on the home page and on /hard-money-loans.
// Every figure is a program maximum from the lender program specification used across
// our investor sites. Change a number here only when the specification changes.

export interface Program {
  id: string;
  name: string;
  use: string;
  max: string;
  term: string;
  financingType: string;
  intro: string;
  terms: [string, string][];
  notes: string[];
}

export const PROGRAMS: Program[] = [
  {
    id: "fix-and-flip",
    name: "Fix and flip",
    use: "Buying a house that needs work and selling it after the renovation",
    max: "90% of the price and 100% of the rehab",
    term: "12 months",
    financingType: "fix_and_flip",
    intro:
      "The loan covers most of the purchase at closing and holds the whole renovation budget aside. Each time a stage of work is finished and inspected, that part of the budget is released. You repay it when the house sells or when you refinance.",
    terms: [
      ["Purchase price financed", "Up to 90%"],
      ["Renovation budget financed", "100%, paid in draws"],
      ["Total loan against the after-repair value", "Up to 70%, or 75% for experienced investors"],
      ["Loan size", "$50,000 to $3,000,000"],
      ["Term", "12 months, interest only. 18 to 24 months for additions and ADUs"],
      ["Prepayment penalty", "None"],
      ["Credit score", "660 and up. 680 for a first flip"],
    ],
    notes: [
      "A first flip qualifies with 680 credit: 75% of the price, 80% at 720 and 90% at 740, plus a light or moderate rehab up to $100,000.",
      "Interest on loans of $100,000 or more is charged only on money already drawn.",
      "Wholesale deals are accepted with an assignment fee of up to 20% of the price.",
    ],
  },
  {
    id: "construction",
    name: "Ground-up construction",
    use: "Building new homes on a lot or a teardown",
    max: "75% of the land and 100% of construction",
    term: "12 to 24 months",
    financingType: "rehabilitation",
    intro:
      "The land is funded at closing and the construction budget comes out stage by stage. Up to six months of interest can be built into the loan, so the project is not paying out of pocket while the frame goes up.",
    terms: [
      ["Land or purchase price", "Up to 75%. 60% until permits are issued"],
      ["Construction budget", "100%, paid in draws"],
      ["Total project cost", "Up to 85%, or 90% with interest financed"],
      ["Loan against the completed value", "Up to 70%"],
      ["Loan size", "$50,000 to $3,000,000"],
      ["Credit score", "680 and up"],
    ],
    notes: [
      "This loan is for builders with finished ground-up projects. A licensed general contractor's builds for clients count.",
      "Permits still pending? The loan can start at 60% of the land and rise to 75% once they are issued.",
      "Two homes or a lot split can go in one loan.",
    ],
  },
  {
    id: "bridge",
    name: "Bridge",
    use: "Holding a finished property while it sells or leases up",
    max: "70% of the value",
    term: "12 months",
    financingType: "bridge",
    intro:
      "When the work is done but the house has not sold, a bridge loan pays off the rehab or construction loan and buys up to twelve more months. It also works for buying a finished property quickly.",
    terms: [
      ["Loan against the as-is value", "Up to 70%"],
      ["Loan against your cost, owned under 6 months", "Up to 80%, or 90% for experienced investors"],
      ["Loan size", "$50,000 to $3,000,000"],
      ["Term", "12 months, interest only. One 6-month extension for a fee"],
      ["Prepayment penalty", "None"],
      ["Credit score", "660 and up. 680 for newer investors"],
    ],
    notes: [
      "Renovated homes have no cash-flow test. A property that is not fully updated needs rent of 1.1 times the payment at exit.",
      "A listed property is sized on the lower of the list price and the appraisal.",
    ],
  },
  {
    id: "dscr",
    name: "DSCR rental",
    use: "Keeping the property as a rental for the long run",
    max: "80% of the value",
    term: "30 years",
    financingType: "dscr_takeout",
    intro:
      "A long-term loan that qualifies on the property's rent instead of your income. If the rent is at least 1.05 times the monthly payment with taxes, insurance and HOA, the property qualifies. Most investors use it to pay off a hard money loan once the house is rented.",
    terms: [
      ["Purchase or rate-and-term refinance", "Up to 80% of the value"],
      ["Cash-out refinance", "Up to 75% of the value"],
      ["Minimum DSCR", "1.05"],
      ["Loan size", "$75,000 to $2,000,000"],
      ["Term", "30 years. Fixed, ARM and interest-only options"],
      ["Income documents", "None. No tax returns, W-2s or pay stubs"],
      ["Credit score", "660 and up. 700 for the full 80%"],
    ],
    notes: [
      "Foreign nationals qualify at up to 65% of the value with 12 months of payments held in reserve.",
      "A vacant purchase is qualified on the appraiser's market rent.",
      "Cash-out is available after 90 days of ownership.",
    ],
  },
];

export const HOME_FAQ: [string, string][] = [
  [
    "How is a hard money loan sized?",
    "On the deal itself. We look at the purchase price, the renovation or build budget and what the property is worth when the work is finished, then apply the program limits. Credit and experience move the numbers, but there are no tax returns or pay stubs.",
  ],
  [
    "Does checking terms hurt my credit?",
    "No. Terms come from a soft credit pull that does not show up as an inquiry on your score.",
  ],
  [
    "What credit score do I need?",
    "Most programs start at 660 and a first flip at 680. If your score is lower but you have a long track record, send the deal anyway and tell us about the projects you have finished.",
  ],
  [
    "How much cash do I bring?",
    "On a flip, plan on 10% to 25% of the price plus closing costs and one month of interest. The renovation itself can be financed at 100%.",
  ],
  [
    "Can you finance a house I buy at a foreclosure auction?",
    "Not at the sale itself. Auctions usually want the full bid in cash or certified funds the same day, and a loan cannot close that fast. Once you own the property, a bridge or rental loan can refinance it, depending on its condition and your experience. Call us before you bid and we will tell you which one fits.",
  ],
  [
    "Does the loan have to be in an LLC?",
    "Yes. The borrower is an LLC or a corporation, and you can form one before closing. These are business-purpose loans; we do not finance a home you live in.",
  ],
  [
    "Where do you lend?",
    "We lend in many states across the U.S. Choose your state on the form and we will confirm what is available there.",
  ],
];
