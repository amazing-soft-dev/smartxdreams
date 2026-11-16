import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mdxComponents } from "@/components/blog/mdx-components";
import { PostCover } from "@/components/blog/PostCover";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Container } from "@/components/ui/Container";
import { formatPostDate } from "@/lib/blog/format";
import { allPosts, postBySlug, postCategory, postContent } from "@/lib/blog/posts";
import { pageMetadata } from "@/lib/seo";

type PostPageProps = { params: Promise<{ slug: string }> };

/** Every post page is generated at build time; any other slug is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return allPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) return {};
  const base = pageMetadata({ title: post.title, description: post.description, path: `/blog/${post.slug}` });
  // Lets feed readers find the blog feed from any post.
  const metadata: Metadata = {
    ...base,
    alternates: { ...base.alternates, types: { "application/rss+xml": [{ url: "/blog/rss.xml", title: "SmartxDreams blog" }] } },
  };
  // Drafts are readable by link but stay out of search engines until someone reviews them.
  return post.draft ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

/**
 * A blog post: a header with the title (the page's only h1), byline and dates; a wide cover; and the body
 * set at about 68 characters per line, a comfortable measure for long reading.
 */
export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) notFound();
  const Content = await postContent(post);
  const category = postCategory(post);
  return (
    <main>
      <article aria-labelledby="post-title">
        <header data-nav-theme="light" className="bg-canvas pt-32 pb-12 md:pt-40 md:pb-16">
          <Container>
            <TransitionLink
              href="/blog"
              className="inline-flex min-h-10 items-center gap-2 text-label font-medium text-ink/70 transition-colors hover:text-ink"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none">
                <path d="M13 8H3m4-4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              All articles
            </TransitionLink>
            <div className="mt-8 max-w-4xl">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-label text-ink/70">
                {post.draft ? <span className="rounded-full bg-coral-50 px-2.5 py-0.5 font-medium text-coral-900">Draft</span> : null}
                <span className="font-medium text-coral-700">{category.label}</span>
                <span aria-hidden="true">·</span>
                <span>{post.readingMinutes} min read</span>
              </p>
              <h1 id="post-title" className="mt-5 text-h2">
                {post.title}
              </h1>
              <p className="mt-5 max-w-3xl text-body-l text-ink/70">{post.description}</p>
              <p className="mt-6 text-label text-ink/65">
                By the SmartxDreams team · Published <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                {post.updated ? (
                  <>
                    {" "}
                    · Updated <time dateTime={post.updated}>{formatPostDate(post.updated)}</time>
                  </>
                ) : null}
              </p>
            </div>
            {post.draft ? (
              <p
                role="note"
                className="mt-8 max-w-[68ch] rounded-[18px] border border-coral-600/50 bg-coral-50 px-5 py-4 text-label text-ink"
              >
                <strong className="font-semibold">Draft.</strong> Nobody has reviewed this post yet, so it may change. It is hidden from
                search engines until it is published.
              </p>
            ) : null}
            <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[30px] md:aspect-[21/9]">
              <PostCover post={post} priority sizes="(min-width: 1280px) 1280px, 100vw" />
            </div>
          </Container>
        </header>

        <div data-nav-theme="light" className="bg-white py-16 md:py-20">
          <Container>
            {/* About 68 characters per line. CSS ch is the width of "0", wider than the average letter in Inter
                Tight, so max-width: 68ch would give about 95. 49ch at 18 px renders about 68. */}
            <div className="max-w-[49ch] text-body-l">
              <Content components={mdxComponents} />
            </div>
          </Container>
        </div>
      </article>
    </main>
  );
}
