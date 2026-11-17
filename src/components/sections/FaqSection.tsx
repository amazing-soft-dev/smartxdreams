import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { Accordion } from "@/components/ui/Accordion";
import { faqJsonLd } from "@/components/ui/faq-json-ld";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Faq } from "@/content/types";

type FaqSectionProps = {
  items: Faq[];
  title?: string;
  id?: string;
  /** Optional content under the accordion, such as a link to ask a question that is not listed. */
  footer?: ReactNode;
};

/**
 * Frequently asked questions: an accessible accordion plus matching FAQPage JSON-LD, built from the same
 * items so the structured data never drifts from what is on the page.
 */
export function FaqSection({ items, title = "Questions, *answered plainly.*", id = "faq", footer }: FaqSectionProps) {
  return (
    <Section id={id} labelledBy={`${id}-title`} surface="canvas">
      <JsonLd data={faqJsonLd(items)} />
      <SectionHeader id={`${id}-title`} tag="FAQ" title={title} />
      <Accordion items={items} className="mx-auto mt-12 max-w-3xl" />
      {footer ? <div className="mx-auto mt-10 max-w-3xl text-center text-body text-ink/75">{footer}</div> : null}
    </Section>
  );
}
