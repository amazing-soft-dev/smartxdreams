import type { Person, TeamGroup } from "./types";

/** Section labels for each group, in the order the About page shows them. */
export const teamGroups: Record<TeamGroup, string> = {
  founders: "Founders",
  engineering: "Engineering",
  design: "Design",
  data: "Data",
  ai: "AI",
};

/**
 * The people behind the products, founders first. Every profile is marked illustrative: the names and
 * portraits stand in until each person is ready to be introduced, and are replaced one by one.
 */
export const team: readonly Person[] = [
  {
    slug: "isabela-moreno",
    name: "Isabela Moreno",
    role: "CEO & Co-founder",
    group: "founders",
    bio: "Chooses which everyday problems the studio takes on, and decides when a product is ready to leave its waitlist.",
    focus: ["Strategy", "Product"],
    photo: { slot: "team-isabela-moreno" },
    illustrative: true,
  },
  {
    slug: "martin-kessler",
    name: "Martin Kessler",
    role: "CTO & Co-founder",
    group: "founders",
    bio: "Sets how every product is built and tested, and reviews where each answer comes from before it ships.",
    focus: ["Architecture", "Security"],
    photo: { slot: "team-martin-kessler" },
    illustrative: true,
  },
  {
    slug: "luca-bianchi",
    name: "Luca Bianchi",
    role: "Senior Software Engineer",
    group: "engineering",
    bio: "Builds the review steps that let a person check every answer before anything is sent.",
    focus: ["Web apps", "Review flows"],
    photo: { slot: "team-luca-bianchi" },
    illustrative: true,
  },
  {
    slug: "marcus-bell",
    name: "Marcus Bell",
    role: "Software Engineer",
    group: "engineering",
    bio: "Works on the browser extension and the forms it fills, field by field.",
    focus: ["Extensions", "Forms"],
    photo: { slot: "team-marcus-bell" },
    illustrative: true,
  },
  {
    slug: "kevin-tran",
    name: "Kevin Tran",
    role: "Software Engineer",
    group: "engineering",
    bio: "Keeps the services behind every product fast, private and easy to run.",
    focus: ["Platform", "Privacy"],
    photo: { slot: "team-kevin-tran" },
    illustrative: true,
  },
  {
    slug: "claire-donovan",
    name: "Claire Donovan",
    role: "Product Designer",
    group: "design",
    bio: "Designs screens that older readers and busy site crews can use without a manual.",
    focus: ["Interface", "Accessibility"],
    photo: { slot: "team-claire-donovan" },
    illustrative: true,
  },
  {
    slug: "arjun-mehta",
    name: "Arjun Mehta",
    role: "Data Engineer",
    group: "data",
    bio: "Brings job listings, dental plans and policy documents into a shape the products can read.",
    focus: ["Pipelines", "Sources"],
    photo: { slot: "team-arjun-mehta" },
    illustrative: true,
  },
  {
    slug: "nina-petrova",
    name: "Nina Petrova",
    role: "Data Engineer",
    group: "data",
    bio: "Checks that every source is current and every duplicate is merged before it reaches a list.",
    focus: ["Data quality", "Freshness"],
    photo: { slot: "team-nina-petrova" },
    illustrative: true,
  },
  {
    slug: "amara-osei",
    name: "Amara Osei",
    role: "AI Engineer",
    group: "ai",
    bio: "Tunes the models that read and draft, and measures how often a person has to correct them.",
    focus: ["Models", "Evaluation"],
    photo: { slot: "team-amara-osei" },
    illustrative: true,
  },
];
