import { z } from "zod";
import { blogCategoryIds } from "@/content/blog/categories";
import { photos } from "@/content/photos";
import { productSlugs } from "@/content/selectors";

const isoDate = (field: string) => z.iso.date(`Write ${field} as YYYY-MM-DD, for example 2026-11-15.`);

/**
 * The frontmatter every post must have. Unknown keys are errors too, so a typo such as `catgory` fails the
 * build instead of being ignored. See docs/blog.md.
 */
export const frontmatterSchema = z.strictObject({
  title: z.string().trim().min(10, "Use a title of at least 10 characters.").max(90, "Keep the title to 90 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(50, "Write a description of at least 50 characters: it is the summary in search results and on cards.")
    .max(160, "Keep the description to 160 characters or fewer: search results cut it off after that."),
  date: isoDate("date"),
  updated: isoDate("updated").optional(),
  category: z.enum(blogCategoryIds, { error: `Use one of these categories: ${blogCategoryIds.join(", ")}.` }),
  /** Products the post is about, by slug. Drives the product links at the end of a post. */
  products: z
    .array(
      z.string().refine((slug) => productSlugs().includes(slug), { error: (issue) => `"${String(issue.input)}" is not a product slug.` }),
    )
    .default([]),
  /** Cover photo from the registry (src/content/photos.json). */
  cover: z
    .strictObject({
      slot: z
        .string()
        .refine((slot) => photos.some((p) => p.slot === slot), { error: (issue) => `No photo slot "${String(issue.input)}".` }),
    })
    .optional(),
  /** Unreviewed posts: shown with a "Draft" label, kept out of search engines, the sitemap and the RSS feed. */
  draft: z.boolean().default(false),
  /** The post shown large at the top of the blog index. The newest featured post wins. */
  featured: z.boolean().default(false),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
