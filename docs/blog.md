# Writing a blog post

Posts are MDX files in `src/content/blog/posts/`. The file name is the URL:
`why-we-build.mdx` becomes `/blog/why-we-build`. Use lowercase letters, digits and single hyphens.

## Frontmatter

Every post starts with a YAML block. The build checks it with zod (`src/lib/blog/schema.ts`), and any
mistake fails the build with the file name and the field, for example:

```
Invalid frontmatter in src/content/blog/posts/example.mdx:
  - date: Write date as YYYY-MM-DD, for example 2026-11-15.
  - products.0: "nope" is not a product slug.
```

```yaml
---
title: "Why we build one product per problem"        # 10–90 characters, unique
description: "One or two sentences, 50–160 characters." # search results and cards
date: "2026-11-15"                                   # YYYY-MM-DD
updated: "2026-12-01"                                # optional
category: "studio"                                   # a category id
products: ["kinly"]                                  # optional product slugs
cover:                                               # optional, a slot in src/content/photos.json
  slot: "blog-studio"
draft: true                                          # optional, see below
featured: true                                       # optional, see below
---
```

- **draft:** for posts nobody has reviewed yet. A draft is readable by link and shows a "Draft" label, but
  it is marked `noindex` and left out of the sitemap and the RSS feed.
- **featured:** the newest featured post is shown large at the top of `/blog`.
- Unknown keys are errors, so a typo cannot be silently ignored.

## Body

- Start headings at `##`. The post title is the page's only `h1`.
- Link to site pages with a path (`/products/kinly`); these use client-side navigation.
- No invented statistics, quotes, customers or results. If you cite a number, link its source.
- Third-party names as plain text only, never logos.
