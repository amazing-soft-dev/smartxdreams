/**
 * Blog categories. Each has its own page at /blog/category/<id>. Order is the order of the filter chips.
 * Product categories map to the products they cover, so a category page can point to the right waitlists.
 */
export const blogCategories = [
  {
    id: "job-search",
    label: "Job search",
    description: "Finding the right roles, applying well and keeping track of it all.",
    products: ["joined", "acorn"],
  },
  {
    id: "construction",
    label: "Construction",
    description: "Daily site reports, records and the paperwork around a build.",
    products: ["sitelog"],
  },
  {
    id: "dental-costs",
    label: "Dental costs",
    description: "Making sense of treatment quotes, insurance plans and what you will really pay.",
    products: ["toothledger"],
  },
  {
    id: "later-life",
    label: "Later life",
    description: "Bills, letters, paperwork and staying safe from scams.",
    products: ["senioraiplans"],
  },
  {
    id: "security-reviews",
    label: "Security reviews",
    description: "Security questionnaires, policies and the evidence behind each answer.",
    products: ["trustdraft"],
  },
  {
    id: "studio",
    label: "Studio notes",
    description: "How and why we build SmartxDreams products.",
    products: [],
  },
] as const satisfies readonly { id: string; label: string; description: string; products: readonly string[] }[];

export type BlogCategory = (typeof blogCategories)[number];
export type BlogCategoryId = BlogCategory["id"];

export const blogCategoryIds = blogCategories.map((c) => c.id) as [BlogCategoryId, ...BlogCategoryId[]];

export function blogCategoryById(id: string): BlogCategory | undefined {
  return blogCategories.find((c) => c.id === id);
}
