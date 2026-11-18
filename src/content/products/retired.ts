/**
 * Products that were renamed, by their old slug: the old name, and the slug the product lives at now.
 * Old links, search results and waitlist emails still use these, so the server redirects them, the static
 * export keeps a forwarding page for each, and waitlist requests and tokens accept them.
 */
export const retiredProducts: Readonly<Record<string, { name: string; successor: string }>> = {
  jobatlas: { name: "JobAtlas", successor: "joined" },
  applypilot: { name: "ApplyPilot", successor: "acorn" },
  kinly: { name: "Kinly", successor: "senioraiplans" },
};

/** The slug a product lives at now: its successor's for a retired slug, otherwise the slug itself. */
export function currentProductSlug(slug: string): string {
  return retiredProducts[slug]?.successor ?? slug;
}
