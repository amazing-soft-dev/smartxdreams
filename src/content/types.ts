/**
 * Content model for the SmartxDreams site. All copy lives in src/content and is typed here,
 * so pages and components never hard-code text.
 */

/** Who a product is for. Drives the audience filter on /products. */
export type Audience = "job-seekers" | "builders" | "patients" | "seniors" | "software-teams";

/** Launch state. Every product starts on a waitlist. */
export type ProductStatus = "waitlist" | "beta" | "live";

export type NavItem = {
  label: string;
  href: string;
  /** Short line shown under the label in the mega-menu. */
  description?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type Faq = {
  question: string;
  answer: string;
};

export type Step = {
  title: string;
  body: string;
};

export type Feature = {
  title: string;
  body: string;
};

export type Product = {
  /** URL segment: /products/<slug>. */
  slug: string;
  name: string;
  /** One line under the name. */
  tagline: string;
  /** Two or three sentences for cards and meta descriptions. */
  summary: string;
  audience: Audience;
  status: ProductStatus;
  /** The problem the product solves, in the user's words. */
  problem: string;
  /** How it works, three or four steps. */
  steps: Step[];
  features: Feature[];
  /** Who it is for, as short phrases. */
  whoFor: string[];
  /** What it does not do. Shown on every product page. */
  limits: string[];
  faq: Faq[];
  /** Legal or safety note shown near the call to action, when the product needs one. */
  disclaimer?: string;
  /** The product's core promise, shown as a band after the steps (for example the review step). */
  promise?: { title: string; body: string };
  /** "large": the page uses larger type and stronger text contrast (for example SeniorAIPlans, for older readers). */
  readability?: "standard" | "large";
  /** How the product handles personal data, as short plain statements. Shown as "Your data". */
  dataHandling?: string[];
  /** Small print under the limits, such as the third-party trademark note. */
  footnote?: string;
  /** Photo for the "who it is for" section, by registry slot (src/content/photos.json). */
  photo?: { slot: string };
  /** Slugs of related products. */
  related: string[];
  seo: {
    title: string;
    description: string;
  };
};

export type PostCategory = "guides" | "case-studies" | "engineering" | "perspectives";

export type Post = {
  slug: string;
  title: string;
  description: string;
  category: PostCategory;
  /** ISO date, YYYY-MM-DD. */
  publishedAt: string;
  author: string;
  /** Related product slug, if the post is about one product. */
  product?: string;
  /** Seed posts stay drafts until the team edits them. */
  draft: boolean;
};
