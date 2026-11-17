import type { Element, ElementContent, Root, RootContent } from "hast";

export type Heading = { id: string; text: string; depth: 2 | 3 };

/** "What this means for you" -> "what-this-means-for-you". */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/[\s-]+/g, "-") || "section"
  );
}

/** A slugger that keeps ids unique within one post: "faq", "faq-2", "faq-3". */
function createSlugger() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
}

/** Plain text of a Markdown heading line: links, code, emphasis and HTML removed. */
function plainHeading(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .trim();
}

/**
 * The h2 and h3 headings of a post body, in order, with the same ids the rehype plugin below gives the
 * rendered headings. Headings inside fenced code blocks are skipped.
 */
export function extractHeadings(body: string): Heading[] {
  const slug = createSlugger();
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match?.[1] || !match[2]) continue;
    const text = plainHeading(match[2]);
    headings.push({ id: slug(text), text, depth: match[1].length as 2 | 3 });
  }
  return headings;
}

function textOf(node: Root | RootContent | ElementContent): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return node.children.map((child) => textOf(child)).join("");
  return "";
}

/**
 * Rehype plugin: gives every h2 and h3 an id from its text, so the table of contents and shared links can
 * point at sections. Uses the same slugger as extractHeadings, so the ids always match.
 */
export function rehypeHeadingIds() {
  return (tree: Root) => {
    const slug = createSlugger();
    const visit = (node: Root | RootContent) => {
      if (node.type === "element" && (node.tagName === "h2" || node.tagName === "h3")) {
        (node as Element).properties.id = slug(textOf(node).trim());
      }
      if ("children" in node) node.children.forEach(visit);
    };
    visit(tree);
  };
}
