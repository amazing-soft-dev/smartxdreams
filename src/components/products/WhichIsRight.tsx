import { TransitionLink } from "@/components/transition/TransitionLink";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { productNeeds } from "@/content/needs";
import { productBySlug } from "@/content/selectors";

/**
 * "Which is right for me?": six needs in the visitor's own words, each linking to the product that meets
 * it. A plain list of links, so it works without JavaScript and with the keyboard (Tab, then Enter).
 */
export function WhichIsRight() {
  return (
    <Section labelledBy="which-title" surface="white">
      <SectionHeader id="which-title" tag="Not sure?" title="Which one is *right for you?*" description="Pick the sentence that sounds most like you." />
      <ul className="mx-auto mt-12 flex max-w-3xl flex-col gap-2">
        {productNeeds.map(({ need, slug }) => {
          const product = productBySlug(slug);
          if (!product) return null;
          return (
            <li key={slug}>
              <TransitionLink
                href={`/products/${slug}`}
                className="group flex items-center justify-between gap-4 rounded-[20px] bg-canvas px-6 py-5 transition-colors duration-250 hover:bg-canvas-200"
              >
                <span className="text-body-l">“{need}”</span>
                <span className="shrink-0 text-label font-medium text-violet-600">
                  {/* The arrow turns up and out on hover and focus, to the pose Beemas' arrows rest in. */}
                  {product.name} <span aria-hidden="true" className="inline-block transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:-rotate-30 group-focus-visible:-rotate-30 motion-reduce:transition-none">→</span>
                </span>
              </TransitionLink>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
