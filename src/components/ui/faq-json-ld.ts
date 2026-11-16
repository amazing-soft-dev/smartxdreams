import type { Faq } from "@/content/types";

/**
 * schema.org FAQPage for a list of questions, to render with the JsonLd component next to an Accordion.
 * Only use it where the questions and answers are visible on the page.
 */
export function faqJsonLd(items: Faq[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
