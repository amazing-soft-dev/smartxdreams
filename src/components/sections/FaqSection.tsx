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
};

/**
 * Frequently asked questions: an accessible accordion plus matching FAQPage JSON-LD, built from the same
 * items so the structured data never drifts from what is on the page.
 */
export function FaqSection({ items, title = "Questions, *answered plainly.*", id = "faq" }: FaqSectionProps) {
  return (
    <Section id={id} labelledBy={`${id}-title`} surface="canvas">
      <JsonLd data={faqJsonLd(items)} />
      <SectionHeader id={`${id}-title`} tag="FAQ" title={title} />
      <Accordion items={items} className="mx-auto mt-12 max-w-3xl" />
    </Section>
  );
}
