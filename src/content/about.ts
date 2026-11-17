/**
 * About page copy. No people, dates or numbers are named here: the studio introduces its team and
 * history only once there is something true to say.
 */
export const about = {
  hero: {
    title: "We build AI that does the *paperwork*, so you can make the call.",
    body: "SmartxDreams is a studio making focused AI products for the forms, reports, bills and letters that fill an ordinary week.",
  },
  story: {
    title: "Why we *started*",
    paragraphs: [
      "A lot of everyday work follows the same pattern. A job form asks for details you have typed many times before. A site report is written from memory at the end of a long shift. A dental quote arrives with no clear price. A letter from an insurer needs a second read, and a security questionnaire needs answers someone has already written somewhere else.",
      "Modern AI is good at this kind of work: reading documents, finding the passage that matters and drafting a first version. It is not good at deciding for you. So every SmartxDreams product does the reading and the drafting, and leaves the decision with a person.",
      "We build one product for each problem instead of one assistant for everything. A product with one job can be honest about what it does, what it does not do, and where each answer comes from.",
    ],
  },
  values: [
    {
      title: "One job per product",
      body: "Each product solves one problem well and says plainly what it does not do.",
    },
    {
      title: "Plain words",
      body: "We write for the people who use our products. If a sentence needs a glossary, we rewrite it.",
    },
    {
      title: "No made-up proof",
      body: "No invented testimonials, user counts or results. When we publish a number, we say where it came from.",
    },
    {
      title: "Built with the waitlist",
      body: "The people on each waitlist help decide what we build first, and they get early access before anyone else.",
    },
  ],
  team: {
    title: "The *people* behind the products",
    body: "Team profiles will appear here once the people behind each product are ready to be introduced. Until then, here is how the work is split.",
    roles: [
      {
        title: "Founders",
        body: "Choose which problems to take on, and decide when a product is ready to leave the waitlist.",
      },
      {
        title: "Builders",
        body: "Design, build and test each product, and review every claim and disclaimer before it ships.",
      },
    ],
  },
} as const;
