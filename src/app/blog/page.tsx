import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogBrowser } from "@/components/blog/BlogBrowser";
import { PostTeaser } from "@/components/blog/PostTeaser";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { blogCategories } from "@/content/blog/categories";
import { featuredPost, listedPosts, type Post } from "@/lib/blog/posts";
import { pageMetadata } from "@/lib/seo";
import { SplitText } from "@/components/motion/SplitText";

const base = pageMetadata({
  title: "Blog",
  description:
    "Plain-language notes on job search, site reports, dental costs, paperwork and security reviews, and on how SmartxDreams builds its products.",
  path: "/blog",
});

// Lets feed readers find the blog feed from the index, as they can from any post or category.
export const metadata: Metadata = {
  ...base,
  alternates: { ...base.alternates, types: { "application/rss+xml": [{ url: "/blog/rss.xml", title: "SmartxDreams blog" }] } },
};

/** Server-rendered grid shown until the browser reads ?category=, and in the static HTML: every post but the featured one. */
function ArticleGrid({ posts }: { posts: Post[] }) {
  return (
    <ul className="mt-30 grid gap-3 min-[700px]:grid-cols-2 min-[1200px]:grid-cols-3">
      {posts.map((post) => (
        <li key={post.slug}>
          <PostTeaser post={post} />
        </li>
      ))}
    </ul>
  );
}

/** /blog: the featured post, then every post with category filters. */
export default function BlogPage() {
  const posts = listedPosts();
  const featured = featuredPost(posts);
  const rest = posts.filter((p) => p !== featured);
  // Chips only for categories that have posts, in the categories file order.
  const options = [
    { id: "all", label: "All" },
    ...blogCategories.filter((c) => posts.some((p) => p.category === c.id)).map((c) => ({ id: c.id, label: c.label })),
  ];
  const items = posts.map((post) => ({ slug: post.slug, category: post.category, card: <PostTeaser post={post} /> }));
  return (
    <main id="main" tabIndex={-1}>
      <section
        aria-labelledby="blog-title"
        data-surface="dark"
        data-nav-theme="dark"
        // Phones: the same shorter hero as /products, so the featured article's title is on the first screen.
        className="relative isolate overflow-hidden bg-ink pt-28 pb-12 text-white md:pt-44 md:pb-24"
      >
        <Glow color="violet" size={880} opacity={0.4} className="-top-1/2 left-1/2 -translate-x-1/2" />
        <Container className="text-center">
          <Tag tone="dark">Blog</Tag>
          <h1 id="blog-title" className="mx-auto mt-6 max-w-3xl text-display">
            <SplitText text="Notes on the *problems* we are solving." tone="dark" aboveFold />
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-l text-white/70">
            Plain-language guides on job search, site reports, dental costs, paperwork and security reviews, plus notes on how we build.
          </p>
        </Container>
      </section>

      {featured ? (
        <Section labelledBy="featured-title" surface="canvas" className="pb-0 max-md:pt-10 md:pb-0 xl:pb-0">
          <h2 id="featured-title" className="sr-only">
            Featured post
          </h2>
          <PostTeaser post={featured} featured headingLevel="h3" priority />
        </Section>
      ) : (
        <Section surface="canvas">
          <p className="text-center text-body-l text-ink/70">The first posts are on their way.</p>
        </Section>
      )}

      {rest.length > 0 ? (
        <Section labelledBy="articles-title" surface="canvas">
          <h2 id="articles-title" className="text-h4">
            All articles
          </h2>
          {/* The browser reads search params, so it renders inside Suspense; the fallback lists every article. */}
          <Suspense fallback={<ArticleGrid posts={rest} />}>
            <BlogBrowser items={items} options={options} featuredSlug={featured?.slug} />
          </Suspense>
        </Section>
      ) : null}
    </main>
  );
}
