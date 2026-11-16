import type { MetadataRoute } from "next";
import { blogCategories } from "@/content/blog/categories";
import { publishedPosts } from "@/lib/blog/posts";
import { readyRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

// Static so it is written to out/sitemap.xml in the static export.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = readyRoutes().map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
  // Published posts only: drafts are noindex until someone reviews them.
  const posts: MetadataRoute.Sitemap = publishedPosts().map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.updated ?? post.date,
    changeFrequency: "yearly",
    priority: 0.6,
  }));
  // Category pages that have at least one published post; the others are noindex.
  const categories: MetadataRoute.Sitemap = blogCategories
    .filter((c) => publishedPosts().some((p) => p.category === c.id))
    .map((c) => ({ url: absoluteUrl(`/blog/category/${c.id}`), changeFrequency: "weekly", priority: 0.5 }));
  return [...pages, ...posts, ...categories];
}
