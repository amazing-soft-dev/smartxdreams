import { Photo } from "@/components/ui/Photo";
import type { BlogCategoryId } from "@/content/blog/categories";
import { cx } from "@/lib/cx";
import type { Post } from "@/lib/blog/posts";
import { postCategory } from "@/lib/blog/posts";

/** Brand gradients per category, for posts without a cover photo. */
const tones: Record<BlogCategoryId, string> = {
  "job-search": "bg-[linear-gradient(140deg,#6D4AFF_0%,#371D93_55%,#0F1226_100%)]",
  construction: "bg-[linear-gradient(140deg,#FF8457_0%,#932F15_55%,#0F1226_100%)]",
  "dental-costs": "bg-[linear-gradient(140deg,#AA97FF_0%,#5A36E6_50%,#0F1226_100%)]",
  "later-life": "bg-[linear-gradient(140deg,#FFA17C_0%,#BF3F1C_50%,#0F1226_100%)]",
  "security-reviews": "bg-[linear-gradient(140deg,#3D4370_0%,#1B1F3A_55%,#0F1226_100%)]",
  studio: "bg-[linear-gradient(140deg,#6D4AFF_0%,#932F15_60%,#0F1226_100%)]",
};

/**
 * A post's cover: its registry photo when it has one, otherwise a code-built cover in the category's
 * brand gradient with the category name set large. Decorative either way: the card names the post.
 */
export function PostCover({ post, sizes, priority = false }: { post: Post; sizes: string; priority?: boolean }) {
  if (post.cover) return <Photo slot={post.cover.slot} fill sizes={sizes} priority={priority} />;
  const category = postCategory(post);
  return (
    <div aria-hidden="true" className={cx("absolute inset-0 overflow-hidden text-white", tones[category.id])}>
      {/* A faint dot grid gives the flat gradient some texture. */}
      <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.14)_1px,transparent_1px)] [background-size:18px_18px]" />
      <span className="absolute right-6 bottom-5 left-6 text-[clamp(1.75rem,5vw,3rem)] leading-none font-medium tracking-[-0.02em] text-white/90">
        {category.label}
      </span>
    </div>
  );
}
