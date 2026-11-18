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
