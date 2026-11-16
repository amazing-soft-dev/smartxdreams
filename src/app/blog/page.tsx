import type { Metadata } from "next";
import { PostTeaser } from "@/components/blog/PostTeaser";
import { Accent } from "@/components/ui/Accent";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { featuredPost, listedPosts } from "@/lib/blog/posts";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description:
    "Plain-language notes on job search, site reports, dental costs, paperwork and security reviews, and on how SmartxDreams builds its products.",
  path: "/blog",
});

/** /blog: the featured post, then every post with category filters. */
export default function BlogPage() {
  const posts = listedPosts();
  const featured = featuredPost(posts);
  const rest = posts.filter((p) => p !== featured);
  return (
    <main>
      <section
        aria-labelledby="blog-title"
        data-surface="dark"
        data-nav-theme="dark"
        className="relative isolate overflow-hidden bg-ink pt-36 pb-20 text-white md:pt-44 md:pb-24"
      >
        <Glow color="violet" size={880} opacity={0.4} className="-top-1/2 left-1/2 -translate-x-1/2" />
        <Container className="text-center">
          <Tag tone="dark">Blog</Tag>
          <h1 id="blog-title" className="mx-auto mt-6 max-w-3xl text-display">
            <Accent text="Notes on the *problems* we are solving." tone="dark" />
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-l text-white/70">
            Plain-language guides on job search, site reports, dental costs, paperwork and security reviews, plus notes on how we build.
          </p>
        </Container>
      </section>

      {featured ? (
        <Section labelledBy="featured-title" surface="canvas" className="pb-0 md:pb-0 xl:pb-0">
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
          <ul className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <li key={post.slug}>
                <PostTeaser post={post} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </main>
  );
}
