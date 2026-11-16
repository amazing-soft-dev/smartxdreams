import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostTeaser } from "@/components/blog/PostTeaser";
import { ProductMiniCard } from "@/components/products/ProductMiniCard";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { blogCategories, blogCategoryById } from "@/content/blog/categories";
import { productBySlug } from "@/content/selectors";
import type { Product } from "@/content/types";
import { cx } from "@/lib/cx";
import { listedPosts, publishedPosts } from "@/lib/blog/posts";
import { pageMetadata } from "@/lib/seo";

type CategoryPageProps = { params: Promise<{ cat: string }> };

/** One page per category, generated at build time; any other value is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return blogCategories.map((c) => ({ cat: c.id }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { cat } = await params;
  const category = blogCategoryById(cat);
  if (!category) return {};
  const base = pageMetadata({
    title: `${category.label} articles`,
    description: `${category.description} Plain-language notes from SmartxDreams.`,
    path: `/blog/category/${category.id}`,
  });
  const metadata: Metadata = {
    ...base,
    alternates: { ...base.alternates, types: { "application/rss+xml": [{ url: "/blog/rss.xml", title: "SmartxDreams blog" }] } },
  };
  // A category with no published posts is a thin page: keep it out of search results until it has one.
  const hasPublished = publishedPosts().some((p) => p.category === category.id);
  return hasPublished ? metadata : { ...metadata, robots: { index: false, follow: true } };
}

/** /blog/category/<id>: every listed post in one category, and the products it covers. */
export default async function BlogCategoryPage({ params }: CategoryPageProps) {
  const { cat } = await params;
  const category = blogCategoryById(cat);
  if (!category) notFound();
  const posts = listedPosts().filter((p) => p.category === category.id);
  const products = category.products.map((slug) => productBySlug(slug)).filter((p): p is Product => p !== undefined);
  return (
    <main id="main" tabIndex={-1}>
      <section
        aria-labelledby="category-title"
        data-surface="dark"
        data-nav-theme="dark"
        className="relative isolate overflow-hidden bg-ink pt-36 pb-16 text-white md:pt-44 md:pb-20"
      >
        <Glow color="violet" size={820} opacity={0.35} className="-top-1/2 left-1/2 -translate-x-1/2" />
        <Container className="text-center">
          <Tag tone="dark">Blog category</Tag>
          <h1 id="category-title" className="mx-auto mt-6 max-w-3xl text-display">
            {category.label}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-l text-white/70">{category.description}</p>
        </Container>
      </section>

      <Section labelledBy="category-posts-title" surface="canvas">
        <nav aria-label="Blog categories">
          <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            <li className="shrink-0">
              <TransitionLink
                href="/blog"
                className="inline-flex min-h-11 items-center rounded-tag bg-white px-4 text-label font-medium text-ink/80 shadow-tag hover:text-ink"
              >
                All articles
              </TransitionLink>
            </li>
            {blogCategories.map((c) => {
              const current = c.id === category.id;
              return (
                <li key={c.id} className="shrink-0">
                  <TransitionLink
                    href={`/blog/category/${c.id}`}
                    aria-current={current ? "page" : undefined}
                    className={cx(
                      "inline-flex min-h-11 items-center rounded-tag px-4 text-label font-medium",
                      current ? "bg-coral-500/12 text-coral-700" : "bg-white text-ink/80 shadow-tag hover:text-ink",
                    )}
                  >
                    {c.label}
                  </TransitionLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <h2 id="category-posts-title" className="mt-12 text-h4">
          {posts.length === 0 ? "No articles yet" : posts.length === 1 ? "1 article" : `${posts.length} articles`}
        </h2>
        {posts.length > 0 ? (
          <ul className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.slug}>
                <PostTeaser post={post} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-body-l text-ink/70">
            The first article here is on its way. Meanwhile,{" "}
            <TransitionLink href="/blog" className="font-medium text-ink underline underline-offset-4">
              see all articles
            </TransitionLink>
            .
          </p>
        )}

        {products.length > 0 ? (
          <div className="mt-20">
            <h2 className="text-h4">{products.length === 1 ? "The product for this" : "The products for this"}</h2>
            <ul className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <li key={product.slug}>
                  <ProductMiniCard product={product} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>
    </main>
  );
}
