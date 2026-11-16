import type { Audience, Faq, NavGroup, NavItem } from "./types";

/** Company-level copy. Product copy lives in src/content/products. */
export const company = {
  name: "SmartxDreams",
  tagline: "AI products for everyday work and life.",
  description:
    "SmartxDreams is a studio that builds focused AI products for real problems: finding and applying for jobs, writing daily site reports, understanding dental costs, helping seniors with paperwork, and answering security questionnaires.",
  /** Principles the site repeats on Home and About. */
  principles: [
    {
      title: "A person stays in charge",
      body: "Our products draft, sort and explain. You review and decide before anything is sent, submitted or paid.",
    },
    {
      title: "Answers show their source",
      body: "When a product tells you something, it shows where it came from, and it says so when it cannot back an answer up.",
    },
    {
      title: "Your data stays yours",
      body: "We collect only what a product needs to work, and we never sell it.",
    },
  ],
} as const;

/** Human-readable audience names, in display order. */
export const audiences: { id: Audience; label: string }[] = [
  { id: "job-seekers", label: "Job seekers" },
  { id: "builders", label: "Builders" },
  { id: "patients", label: "Patients" },
  { id: "seniors", label: "Seniors" },
  { id: "software-teams", label: "Software teams" },
];

/** Top-level navigation. "Products" opens the mega-menu built from the product files. */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

/** The header call to action. Every product is on a waitlist, so it points at the product index. */
export const headerCta: NavItem = { label: "Join a waitlist", href: "/products" };

/** Footer link groups. The Products group is filled from the product files at render time. */
export const footerGroups: NavGroup[] = [
  {
    label: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Legal",
    items: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

/** Third-party names appear as plain text only, never as logos. */
export const trademarkNote =
  "Product and company names are trademarks of their respective owners. SmartxDreams is not affiliated with them.";

/** Company FAQ, used on Home and Contact. */
export const companyFaq: Faq[] = [
  {
    question: "Are the products available now?",
    answer:
      "Not yet. Each product has a waitlist. Join the ones you care about and we will email you when early access opens. You can leave the list at any time.",
  },
  {
    question: "Do the products act on their own?",
    answer:
      "No. They prepare work for you: a filled form, a drafted report, an explained bill, a suggested answer. A person reviews it and decides what happens next.",
  },
  {
    question: "What happens to the documents I upload?",
    answer:
      "They are used only to do the job you asked for. We do not sell your data or use it to advertise to you. Each product's page explains what it stores and for how long.",
  },
  {
    question: "Is SmartxDreams giving medical, legal or financial advice?",
    answer:
      "No. Some products explain bills, insurance plans or letters in plain words, but they do not replace a professional. When something matters, check with your dentist, insurer, lawyer or bank.",
  },
];

export type SocialNetwork = "linkedin" | "x" | "github" | "youtube";

/**
 * Company social profiles. Empty until the real URLs exist; the footer shows no social icons while this
 * list is empty, so the site never links to a placeholder profile.
 */
export const socialLinks: { network: SocialNetwork; href: string }[] = [];
