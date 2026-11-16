import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { MDXContent } from "mdx/types";
import { parse as parseYaml } from "yaml";
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
};

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
  return { ...result.data, slug, file, body: source.slice(match[0].length) };
}

let cache: Post[] | undefined;

/** Every post, drafts included, newest first. Read once per build. */
export function allPosts(): Post[] {
  if (cache) return cache;
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

export function postBySlug(slug: string): Post | undefined {
  return allPosts().find((p) => p.slug === slug);
}

/** The post body as a component. Compiled at build time only. */
export function postContent(post: Post): Promise<MDXContent> {
  return compileMdx(post.body, post.file);
}
