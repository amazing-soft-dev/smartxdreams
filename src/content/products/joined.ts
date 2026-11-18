import type { Product } from "../types";
import { trademarkNote } from "../site";

export const joined: Product = {
  slug: "joined",
  name: "Joined",
  tagline: "The major job boards and career pages, searched at once.",
  summary:
    "Joined gathers openings from LinkedIn, Indeed, Jobright, Dice and company career pages into one search, removes duplicates, and shows what each company is like before you apply.",
  audience: "job-seekers",
  status: "waitlist",
  problem:
    "The same job is posted on five sites, many listings are stale, and you lose an evening switching tabs before you even start applying.",
  steps: [
    { title: "Search once", body: "Tell Joined the roles, places and pay you want." },
    {
      title: "See every source",
      body: "Matching jobs from the boards and career pages we cover appear in one list, with duplicates merged.",
    },
    { title: "Check the company", body: "Open any job to see the company's size, funding, reviews and other open roles." },
  ],
  features: [
    {
      title: "One list, many sources",
      body: "Openings from LinkedIn, Indeed, Jobright, Dice and company career pages, side by side. Each listing shows where it came from, and every source we cover is listed in the app.",
    },
    {
      title: "Duplicates merged",
      body: "The same role posted on several boards appears once, with links to every place it was posted.",
    },
    {
      title: "Freshness at a glance",
      body: "See when a job was posted and when we last confirmed it was still open, so you skip stale listings.",
    },
    {
      title: "Company details",
      body: "Size, funding stage, public reviews and the other roles the company is hiring for, before you click apply.",
    },
    {
      title: "Saved searches",
      body: "Save a search and get one email when new matching jobs appear. Nothing else.",
    },
  ],
  whoFor: ["People searching for a new job", "Anyone tired of checking several job boards"],
  limits: [
    "Joined covers the sources listed in the app, not every job site; some roles are only on sites we do not search yet.",
    "Joined links you to the original posting; you apply on the employer's site or through Acorn.",
    "Listings can change or close on the source site before Joined refreshes.",
  ],
  faq: [
    {
      question: "Which job sites does Joined search?",
      answer:
        "LinkedIn, Indeed, Jobright, Dice and company career pages to start, with more added over time. The app lists every source it covers, so you know what is and is not included.",
    },
    {
      question: "Do I apply through Joined?",
      answer:
        "No. Each job links to its original posting, where you apply as usual. If you use Acorn, it can fill the application form for you to review.",
    },
    {
      question: "Is Joined affiliated with LinkedIn, Indeed or the other sites?",
      answer: "No. Joined is independent and shows where each listing came from.",
    },
  ],
  footnote: trademarkNote,
  photo: { slot: "product-joined" },
  logo: { alt: "Joined logo: a red map pin with a tie inside" },
  related: ["acorn"],
  seo: {
    title: "Joined: search the major job boards at once",
    description:
      "Search jobs from LinkedIn, Indeed, Jobright, Dice and company career pages in one place, with duplicates removed and company details alongside.",
  },
};
