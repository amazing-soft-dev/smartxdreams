import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { MDXContent } from "mdx/types";
import { parse as parseYaml } from "yaml";
import { type BlogCategory, type BlogCategoryId, blogCategoryById } from "@/content/blog/categories";
import { compileMdx } from "./mdx";
import { type Frontmatter, frontmatterSchema } from "./schema";

/** Where posts live. One MDX file per post; the file name (without .mdx) is the URL slug. */
const POSTS_DIR = path.join(process.cwd(), "src", "content", "blog", "posts");

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type Post = Frontmatter & {
  slug: string;
  /** Path from the project root, for error messages. */
  file: string;
  /** The MDX body without frontmatter. */
  body: string;
  /** Estimated reading time in whole minutes, at least 1. */
  readingMinutes: number;
};

/** Average adult reading speed for web copy, in words per minute. */
const WORDS_PER_MINUTE = 220;

/**
 * Reading time from the prose only: code blocks, JSX and HTML tags, link targets and Markdown symbols are
 * removed before counting words.
 */
export function readingMinutes(body: string): number {
  const prose = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/^(import|export) .*$/gm, " ")
    .replace(/[#>*_`~|[\]-]+/g, " ");
  const words = prose.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** Reads and validates one post. Any problem throws, which fails the build with the file and the reason. */
function readPost(fileName: string): Post {
  const file = path.posix.join("src/content/blog/posts", fileName);
  const slug = fileName.replace(/\.mdx$/, "");
  if (!SLUG.test(slug)) {
    throw new Error(`${file}: the file name becomes the URL, so use lowercase letters, digits and single hyphens only.`);
  }
  const source = readFileSync(path.join(POSTS_DIR, fileName), "utf8");
  const match = FRONTMATTER.exec(source);
  if (!match) throw new Error(`${file}: missing frontmatter. Start the file with a block between two "---" lines.`);

  let data: unknown;
  try {
    data = parseYaml(match[1] ?? "");
  } catch (error) {
    throw new Error(`${file}: the frontmatter is not valid YAML. ${error instanceof Error ? error.message : ""}`);
  }
  const result = frontmatterSchema.safeParse(data);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `  - ${i.path.join(".") || "frontmatter"}: ${i.message}`).join("\n");
    throw new Error(`Invalid frontmatter in ${file}:\n${problems}`);
  }
  const body = source.slice(match[0].length);
  return { ...result.data, slug, file, body, readingMinutes: readingMinutes(body) };
}

let cache: Post[] | undefined;

/** Builds read the posts once. The dev server re-reads them on every request, so edits show on reload. */
const useCache = process.env.NODE_ENV === "production";

/** Every post, drafts included, newest first. */
export function allPosts(): Post[] {
  if (useCache && cache) return cache;
  let files: string[];
  try {
    files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") files = [];
    else throw error;
  }
  const posts = files.map(readPost);
  const titles = new Set<string>();
  for (const post of posts) {
    if (titles.has(post.title)) throw new Error(`${post.file}: another post already has the title "${post.title}".`);
    titles.add(post.title);
  }
  cache = posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  return cache;
}

/** Posts that are not drafts: the ones in the sitemap and the RSS feed. */
export function publishedPosts(): Post[] {
  return allPosts().filter((p) => !p.draft);
}

/**
 * Posts listed on the blog index and category pages. Drafts are listed everywhere except the production
 * deployment (local, CI and Vercel previews show them with a "Draft" label), so they can be reviewed before
 * anyone flips `draft: false`. Draft pages still build, are marked noindex and stay out of the sitemap and feed.
 */
export function listedPosts(): Post[] {
  return process.env.VERCEL_ENV === "production" ? publishedPosts() : allPosts();
}

/** The newest featured post among these posts, or the newest post when none is featured. */
export function featuredPost(posts: Post[]): Post | undefined {
  return posts.find((p) => p.featured) ?? posts[0];
}

/** Posts in one category, drafts included, newest first. */
export function postsInCategory(id: BlogCategoryId): Post[] {
  return allPosts().filter((p) => p.category === id);
}

/** The category record for a post. Always defined: the schema only accepts known categories. */
export function postCategory(post: Post): BlogCategory {
  const category = blogCategoryById(post.category);
  if (!category) throw new Error(`${post.file}: unknown category "${post.category}".`);
  return category;
}

/**
 * Up to `limit` other listed posts to read next: same category first, then posts about the same products,
 * then the newest. Ties keep newest-first order.
 */
export function relatedPosts(post: Post, limit = 3): Post[] {
  const score = (other: Post) =>
    (other.category === post.category ? 3 : 0) + other.products.filter((slug) => post.products.includes(slug)).length * 2;
  return listedPosts()
    .filter((other) => other.slug !== post.slug)
    .map((other, index) => ({ other, index, score: score(other) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ other }) => other);
}

export function postBySlug(slug: string): Post | undefined {
  return allPosts().find((p) => p.slug === slug);
}

/** The post body as a component. Compiled at build time only. */
export function postContent(post: Post): Promise<MDXContent> {
  return compileMdx(post.body, post.file);
}
