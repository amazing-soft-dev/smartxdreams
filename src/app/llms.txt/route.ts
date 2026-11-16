import { products } from "@/content/products";
import { publishedPosts } from "@/lib/blog/posts";
import { audienceLabel } from "@/content/selectors";
import { company } from "@/content/site";
import { productPagesReady, readyRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

// Static so it is written to out/llms.txt in the static export.
export const dynamic = "force-static";

/** llms.txt (https://llmstxt.org): a plain-text summary of the site for language models. */
export function GET() {
  const lines: string[] = [
    `# ${company.name}`,
    "",
    `> ${company.tagline}`,
    "",
    company.description,
    "",
    "Every product is on a waitlist; none is generally available yet.",
    "",
    "## Products",
    "",
    ...products.map((p) => {
      const name = productPagesReady ? `[${p.name}](${absoluteUrl(`/products/${p.slug}`)})` : p.name;
      return `- ${name} (for ${audienceLabel(p.audience).toLowerCase()}): ${p.summary}`;
    }),
    "",
    "## Principles",
    "",
    ...company.principles.map((p) => `- ${p.title}: ${p.body}`),
    "",
    "## Pages",
    "",
    ...readyRoutes()
      .filter((r) => !r.path.startsWith("/products/"))
      .map((r) => `- ${absoluteUrl(r.path)}`),
    "",
    "## Blog",
    "",
    ...publishedPosts().map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.description}`),
    `- RSS: ${absoluteUrl("/blog/rss.xml")}`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
