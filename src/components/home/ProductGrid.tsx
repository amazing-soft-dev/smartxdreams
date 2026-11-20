import { firstSentence } from "@/lib/first-sentence";
import { Reveal } from "@/components/motion/Reveal";
import { ProductLogo } from "@/components/product/ProductLogo";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { products } from "@/content/products";
import { audienceLabel } from "@/content/selectors";
import { cx } from "@/lib/cx";
import { stagger } from "@/styles/motion";

/**
 * Bento layout, from 1440 px: four columns, the first and last cards two columns wide, the rest single
 * cells (311 px at 1440). Between 1024 and 1439 px four columns would leave single cells 227 to 311 px wide,
 * with summaries wrapping at about 20 characters, so the grid is three equal columns there (307 px at 1024,
 * 392 px at 1280).
 */
const spans = ["xl:col-span-2", "", "", "", "", "xl:col-span-2"];
/** Card surfaces, alternating so neighbours never share a tone. dark: white text, light: ink text. */
const tones = [
  { surface: "bg-ink text-white", dark: true, pill: "bg-white/15" },
  { surface: "bg-white text-ink", dark: false, pill: "bg-ink/[0.07]" },
  // White on violet-500 is 5.15:1; a lighter pill would drop it below 4.5, so this pill darkens instead (7.3:1).
  { surface: "bg-violet-500 text-white", dark: true, pill: "bg-ink/25" },
  { surface: "bg-white text-ink", dark: false, pill: "bg-ink/[0.07]" },
  { surface: "bg-coral-500 text-ink", dark: false, pill: "bg-ink/[0.07]" },
  { surface: "bg-ink-800 text-white", dark: true, pill: "bg-white/15" },
] as const;

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
      <ul className="mt-14 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, i) => {
          const tone = tones[i % tones.length] ?? tones[0];
          const pill = cx("rounded-full px-3 py-1 text-micro font-medium", tone.pill);
          return (
            <li key={product.slug} data-product={product.slug} className={cx(spans[i])}>
              <Reveal preset="up75" delay={(i % 4) * stagger.group} className="h-full">
                <article
                  className={cx(
                    "group relative flex h-full min-h-64 flex-col rounded-[30px] p-7",
                    "outline-offset-4 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-violet-500",
                    "transition-[translate,box-shadow] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-1.5 motion-reduce:hover:translate-y-0 hover:shadow-card-hover has-[a:focus-visible]:-translate-y-1.5 has-[a:focus-visible]:shadow-card-hover motion-reduce:has-[a:focus-visible]:translate-y-0",
                    tone.surface,
                  )}
                >
                  {/* The product's logo on its white tile, then who it is for and where it is in its launch. */}
                  <div className="mb-6 flex items-start justify-between gap-4">
                    {/* On hover the logo tile tilts and grows a touch, as the arrow tile used to. */}
                    <ProductLogo
                      product={product}
                      size={56}
                      decorative
                      className="transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:-rotate-6 group-hover:scale-106 motion-reduce:group-hover:rotate-0 motion-reduce:group-hover:scale-100"
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className={pill}>{audienceLabel(product.audience)}</span>
                      <span className={pill}>
                        {product.status === "waitlist" ? "Waitlist open" : product.status === "beta" ? "Beta" : "Available"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-h4">
                      {/* The link covers the whole card through ::after, so the card is one link whose name is the
                        product name; the focus ring is drawn on the card. */}
                      <TransitionLink
                        href={`/products/${product.slug}`}
                        className="outline-none after:absolute after:inset-0 after:rounded-[30px]"
                      >
                        {product.name}
                      </TransitionLink>
                    </h3>
                    {/* The arrow stays as the cue that the whole card is a link. */}
                    <span
                      aria-hidden="true"
                      className={cx(
                        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-500",
                        tone.dark ? "bg-white/15 text-white group-hover:bg-white group-hover:text-ink" : "bg-ink/[0.07] text-ink group-hover:bg-ink group-hover:text-white",
                      )}
                    >
                      {/* The arrow travels out along its own direction on hover. */}
                      <svg
                        viewBox="0 0 16 16"
                        width="16"
                        height="16"
                        fill="none"
                        className="transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-0"
                      >
                        <path
                          d="M4.5 11.5l7-7M6 4.5h5.5V10"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                  {/* Text stays at 90% strength: enough for 4.5:1 on every card surface. */}
                  <p className="mt-3 max-w-md text-body">{product.tagline}</p>
                  <p className="mt-auto pt-8 text-label">{firstSentence(product.summary)}</p>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
