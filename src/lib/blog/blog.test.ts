import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { blogCategories } from "@/content/blog/categories";
import { extractHeadings, slugify } from "./headings";
import { compileMdx } from "./mdx";
import { allPosts, featuredPost, postBySlug, publishedPosts, readingMinutes, relatedPosts } from "./posts";
import { frontmatterSchema } from "./schema";

describe("the post loader", () => {
  const posts = allPosts();

  it("loads every post with a URL-safe slug and a unique title", () => {
    expect(posts.length).toBeGreaterThanOrEqual(7);
    for (const post of posts) expect(post.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(new Set(posts.map((p) => p.title)).size).toBe(posts.length);
  });

  it("sorts newest first and knows every category", () => {
    const dates = posts.map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    const ids = blogCategories.map((c) => c.id as string);
    for (const post of posts) expect(ids).toContain(post.category);
  });

  it("keeps drafts out of the published list", () => {
    expect(publishedPosts().every((p) => !p.draft)).toBe(true);
    expect(publishedPosts().length).toBeLessThan(posts.length);
  });

  it("finds posts by slug, a featured post and related posts", () => {
    const first = posts[0];
    expect(first && postBySlug(first.slug)).toEqual(first);
    expect(postBySlug("does-not-exist")).toBeUndefined();
    expect(featuredPost(posts)?.featured).toBe(true);
    if (first) {
      const related = relatedPosts(first);
      expect(related.length).toBeLessThanOrEqual(3);
      expect(related.map((p) => p.slug)).not.toContain(first.slug);
    }
  });

  it("gives every post a body without its frontmatter", () => {
    for (const post of posts) expect(post.body.startsWith("---")).toBe(false);
  });
});

describe("readingMinutes", () => {
  const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

  it("counts 220 words a minute, rounded up, at least one", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes(words(220))).toBe(1);
    expect(readingMinutes(words(221))).toBe(2);
  });

  it("ignores code, tags, link targets and Markdown symbols", () => {
    const code = "```ts\n" + words(500) + "\n```";
    expect(readingMinutes(`${words(200)}\n\n${code}\n\n<Note>hi</Note> [a link](https://example.com/a/very/long/path) ## * - >`)).toBe(1);
  });
});

describe("headings", () => {
  it("slugify ids from heading text", () => {
    expect(slugify("What this means for you")).toBe("what-this-means-for-you");
    expect(slugify("1. It says you must act right now")).toBe("1-it-says-you-must-act-right-now");
    expect(slugify("Café & “quotes”")).toBe("cafe-quotes");
    expect(slugify("!!!")).toBe("section");
  });

  it("extract h2 and h3, skip code fences, and de-duplicate ids", () => {
    const body = "## Intro\n\ntext\n\n### Details *here*\n\n```md\n## Not a heading\n```\n\n## Intro\n";
    expect(extractHeadings(body)).toEqual([
      { id: "intro", text: "Intro", depth: 2 },
      { id: "details-here", text: "Details here", depth: 3 },
      { id: "intro-2", text: "Intro", depth: 2 },
    ]);
  });

  it("match the ids the compiled post gives its headings", async () => {
    const body = "## Intro\n\ntext\n\n### Details *here*\n\n## Intro\n";
    const Content = await compileMdx(body, "test.mdx");
    const html = renderToStaticMarkup(createElement(Content));
    for (const h of extractHeadings(body)) expect(html).toContain(`id="${h.id}"`);
  });

  it("match on every real post", async () => {
    for (const post of allPosts()) {
      const html = renderToStaticMarkup(createElement(await compileMdx(post.body, post.file)));
      for (const h of extractHeadings(post.body)) expect(html, post.slug).toContain(`id="${h.id}"`);
    }
  });
});

describe("posts and renamed products", () => {
  it("never name a product by its retired name or link to its old address", () => {
    for (const post of allPosts()) {
      for (const retired of ["JobAtlas", "ApplyPilot", "Kinly", "/products/jobatlas", "/products/applypilot", "/products/kinly"]) {
        expect(post.body, post.slug).not.toContain(retired);
      }
    }
  });
});

describe("frontmatter schema", () => {
  const valid = {
    title: "A good title for a post",
    description: "A description that is long enough to be a useful summary in search results.",
    date: "2026-11-15",
    category: "studio",
  };

  it("accepts a minimal post and fills defaults", () => {
    const result = frontmatterSchema.safeParse(valid);
    expect(result.success && { draft: result.data.draft, featured: result.data.featured, products: result.data.products }).toEqual({
      draft: false,
      featured: false,
      products: [],
    });
  });

  it("explains each mistake", () => {
    const result = frontmatterSchema.safeParse({
      ...valid,
      date: "15/11/2026",
      category: "news",
      products: ["nope"],
      cover: { slot: "missing-photo" },
      catgory: "typo",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    expect(messages).toEqual(
      expect.arrayContaining([
        "date: Write date as YYYY-MM-DD, for example 2026-11-15.",
        expect.stringMatching(/^category: Use one of these categories: job-search/),
        'products.0: "nope" is not a product slug.',
        'cover.slot: No photo slot "missing-photo".',
        expect.stringMatching(/catgory/),
      ]),
    );
  });
});
