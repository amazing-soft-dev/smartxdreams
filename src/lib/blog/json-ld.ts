import { photoBySlot } from "@/content/photos";
import { absoluteUrl, siteUrl } from "@/lib/seo";
import { type Post, postCategory } from "./posts";

/**
 * schema.org BlogPosting for a post. Author and publisher point at the Organization node in the root
 * layout, by @id. The image is listed only when the post has a cover photo (code-built covers are not files).
 */
export function blogPostingJsonLd(post: Post): Record<string, unknown> {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const organization = { "@id": `${siteUrl}/#organization` };
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: organization,
    publisher: organization,
    articleSection: postCategory(post).label,
    inLanguage: "en",
    isPartOf: { "@id": `${siteUrl}/#website` },
    ...(post.cover ? { image: absoluteUrl(photoBySlot(post.cover.slot).src) } : {}),
  };
}
