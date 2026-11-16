import { company } from "@/content/site";
import { postCategory, publishedPosts } from "@/lib/blog/posts";
import { absoluteUrl } from "@/lib/seo";

// Static so it is written to out/blog/rss.xml in the static export.
export const dynamic = "force-static";

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** RFC 822 date, as RSS 2.0 requires: "Sun, 15 Nov 2026 00:00:00 GMT". */
const rssDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`).toUTCString();

/** RSS 2.0 feed of published posts, newest first. Drafts are left out until someone reviews them. */
export function GET() {
  const posts = publishedPosts();
  const feedUrl = absoluteUrl("/blog/rss.xml");
  const items = posts.map((post) => {
    const url = absoluteUrl(`/blog/${post.slug}`);
    return [
      "    <item>",
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${rssDate(post.date)}</pubDate>`,
      `      <category>${escapeXml(postCategory(post).label)}</category>`,
      `      <description>${escapeXml(post.description)}</description>`,
      "    </item>",
    ].join("\n");
  });
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${company.name} blog`)}</title>`,
    `    <link>${absoluteUrl("/blog")}</link>`,
    `    <description>${escapeXml(`Notes from ${company.name} on the problems our products solve and how we build them.`)}</description>`,
    "    <language>en</language>",
    `    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
    posts[0] ? `    <lastBuildDate>${rssDate(posts[0].updated ?? posts[0].date)}</lastBuildDate>` : null,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
