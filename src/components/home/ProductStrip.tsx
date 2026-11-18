import { ProductLogo } from "@/components/product/ProductLogo";
import { Ticker } from "@/components/ui/Ticker";
import { products } from "@/content/products";

/**
 * Under the home hero, where Ignivo shows its customers' logos: the six products' logos and names, running
 * on the Ticker. Not links (the duplicate copy the loop needs would put hidden links in the tab order);
 * the product grid right below links every product.
 */
export function ProductStrip({ label = "Six products from one studio" }: { label?: string }) {
  return (
    <section aria-label={label} data-nav-theme="light" className="bg-canvas py-12 text-ink md:py-14">
      <p className="mb-7 text-center text-label font-medium text-ink/60">{label}</p>
      <Ticker
        label="SmartxDreams products"
        duration={36}
        gap={64}
        items={products.map((product) => (
          <span key={product.slug} className="inline-flex items-center gap-3">
            <ProductLogo product={product} size={40} decorative />
            <span className="text-h6 font-medium tracking-[-0.01em] whitespace-nowrap">{product.name}</span>
          </span>
        ))}
      />
    </section>
  );
}
