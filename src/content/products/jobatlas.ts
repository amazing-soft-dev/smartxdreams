import type { Product } from "../types";

export const jobatlas: Product = {
  slug: "jobatlas",
  name: "JobAtlas",
  tagline: "Every job, from every board, in one place.",
  summary:
    "JobAtlas gathers openings from LinkedIn, Indeed, Jobright, Dice and company career pages into one search, removes duplicates, and shows what each company is like before you apply.",
  audience: "job-seekers",
  status: "waitlist",
  problem:
    "The same job is posted on five sites, half the listings are stale, and you lose an evening switching tabs before you even start applying.",
  steps: [
    { title: "Search once", body: "Tell JobAtlas the roles, places and pay you want." },
    { title: "See every source", body: "Matching jobs from job boards and career pages appear in one list, with duplicates merged." },
    { title: "Check the company", body: "Open any job to see the company's size, funding, reviews and other open roles." },
  ],
  features: [],
  whoFor: ["People searching for a new job", "Anyone tired of checking several job boards"],
  limits: [
    "JobAtlas links you to the original posting; you apply on the employer's site or through ApplyPilot.",
    "Listings can change or close on the source site before JobAtlas refreshes.",
  ],
  faq: [],
  related: ["applypilot"],
  seo: {
    title: "JobAtlas: every job from every board in one search",
    description:
      "Search jobs from LinkedIn, Indeed, Jobright, Dice and company career pages in one place, with duplicates removed and company details alongside.",
  },
};
