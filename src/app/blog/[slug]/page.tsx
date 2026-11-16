import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mdxComponents } from "@/components/blog/mdx-components";
import { Container } from "@/components/ui/Container";
import { allPosts, postBySlug, postContent } from "@/lib/blog/posts";
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
  const metadata = pageMetadata({ title: post.title, description: post.description, path: `/blog/${post.slug}` });
  // Drafts are readable by link but stay out of search engines until someone reviews them.
  return post.draft ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

/** A blog post. A plain layout for now: the full article template replaces it in issue #48. */
export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) notFound();
  const Content = await postContent(post);
  return (
    <main className="bg-white pt-36 pb-24 md:pt-44">
      <Container>
        <article className="mx-auto max-w-[68ch]">
          <h1 className="text-h2">{post.title}</h1>
          <p className="mt-4 text-body-l text-ink/70">{post.description}</p>
          <Content components={mdxComponents} />
        </article>
      </Container>
    </main>
  );
}
