import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { products } from "@/content/products";
import { cx } from "@/lib/cx";

/** Bento layout: the first and last cards are wide on desktop, the rest are single cells. */
const spans = ["lg:col-span-2", "", "", "", "", "lg:col-span-2"];
/** Card surfaces, alternating so neighbours never share a tone. */
const tones = [
  "bg-ink text-white",
  "bg-white text-ink",
  "bg-violet-500 text-white",
  "bg-white text-ink",
  "bg-coral-500 text-ink",
  "bg-ink-800 text-white",
];

/** The six products as a bento grid, generated from src/content/products. */
export function ProductGrid() {
  return (
    <Section id="products" labelledBy="products-title" surface="canvas">
      <SectionHeader
        id="products-title"
        tag="Products"
        title="One studio, *six focused products.*"
        description="Each product does one job well, for one kind of person. All six are in development; join the waitlist for the ones you need."
      />
      <ul className="mt-14 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {products.map((product, i) => (
          <li key={product.slug} className={cx(spans[i])}>
            <Reveal delay={(i % 4) * 0.08} className="h-full">
              <article className={cx("flex h-full min-h-64 flex-col rounded-[30px] p-7", tones[i])}>
                <h3 className="text-h4">{product.name}</h3>
                <p className="mt-3 max-w-md text-body opacity-80">{product.tagline}</p>
                <p className="mt-auto pt-8 text-label opacity-70">{product.summary.split(". ")[0]}.</p>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
