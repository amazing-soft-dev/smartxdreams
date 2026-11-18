import { products } from "../products";
import { trademarkNote } from "../site";
import type { LegalDocument } from "./types";

/** Each product's own "not advice" disclaimer, read from its content file so the two never drift apart. */
const productDisclaimers = products.flatMap((p) => (p.disclaimer ? [`${p.name}: ${p.disclaimer}`] : []));

/**
 * Terms of use for the website. Draft pending counsel review: see docs/legal.md for the points a lawyer must
 * confirm before launch (legal entity, governing law, liability wording). Products get their own terms
 * before anyone can use them.
 */
export const termsOfUse: LegalDocument = {
  title: "Terms of use",
  summary: "The rules for using this website and its waitlists, and what our products are and are not.",
  draftDate: "2026-11-15",
  sections: [
    {
      id: "about-these-terms",
      title: "About these terms",
      blocks: [
        "These terms cover your use of the SmartxDreams website, including its waitlists and contact form. By using the website, you agree to them.",
        "Our products are not available yet. Each product will have its own terms, which you will see before you can use it.",
      ],
    },
    {
      id: "waitlists",
      title: "Waitlists",
      blocks: [
        {
          list: [
            "Joining a waitlist is free. It does not create an account or a contract to supply a product.",
            "A place on a waitlist does not guarantee access, a launch date or a price.",
            "You can leave a waitlist at any time with the link in any waitlist email.",
          ],
        },
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      blocks: [
        "When you use this website, please do not:",
        {
          list: [
            "send spam, or use the forms in an automated way;",
            "sign someone else up, or send their personal data, without their permission;",
            "send passwords, payment card numbers, government ID numbers or health information;",
            "try to break, overload or get around the security of the website;",
            "copy the website at scale, or present it or its content as your own;",
            "pretend to be someone else.",
          ],
        },
        "We may block messages or sign-ups that break these rules.",
      ],
    },
    {
      id: "not-advice",
      title: "Our products are not professional advice",
      blocks: [
        "Our products use AI to read documents, explain them and draft work for a person to review. AI can be wrong. Always check what a product prepares before you rely on it, send it or submit it.",
        "Some products touch on health, insurance, money, employment or legal matters. They do not replace a qualified professional:",
        { list: productDisclaimers },
      ],
    },
    {
      id: "content-and-names",
      title: "Our content and other names",
      blocks: [
        "The text, design and code of this website belong to SmartxDreams. Photos are used under the Unsplash and Pexels licenses and are credited on the About page.",
        trademarkNote,
      ],
    },
    {
      id: "links",
      title: "Links to other websites",
      blocks: ["We may link to other websites. We are not responsible for their content or how they handle your data."],
    },
    {
      id: "no-warranty",
      title: "No warranty",
      blocks: [
        "We work to keep the website accurate and available, but we provide it as it is, without promises that it will always be available, error-free or complete. Product descriptions explain what we are building; details may change before launch.",
        "Nothing in these terms limits rights you have under consumer law that cannot be limited.",
      ],
    },
    {
      id: "changes",
      title: "Changes to these terms",
      blocks: ["When we change these terms, we update this page and its date. The version on this page applies from that date."],
    },
    {
      id: "contact",
      title: "Questions",
      blocks: ["If you have a question about these terms, send us a message through the contact form."],
    },
  ],
};
