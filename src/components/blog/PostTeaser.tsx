import { type Post, postCategory } from "@/lib/blog/posts";
import { postMeta } from "@/lib/blog/format";
import { PostCard } from "./PostCard";
import { PostCover } from "./PostCover";

type PostTeaserProps = {
  post: Post;
  featured?: boolean;
  headingLevel?: "h2" | "h3";
  /** Load the cover eagerly: only for the featured post, which is above the fold. */
  priority?: boolean;
};

/** A PostCard filled in from a post on the server, with its cover rendered here and passed down. */
export function PostTeaser({ post, featured = false, headingLevel, priority }: PostTeaserProps) {
  return (
    <PostCard
      href={`/blog/${post.slug}`}
      title={post.title}
      category={postCategory(post).label}
      meta={postMeta(post)}
      draft={post.draft}
      featured={featured}
      description={featured ? post.description : undefined}
      headingLevel={headingLevel}
      cover={
        <PostCover
          post={post}
          priority={priority}
          sizes={featured ? "(min-width: 768px) 55vw, 100vw" : "(min-width: 1024px) 31vw, (min-width: 768px) 46vw, 100vw"}
        />
      }
    />
  );
}
