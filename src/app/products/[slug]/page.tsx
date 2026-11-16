import { notFound } from "next/navigation";
import { productMockups } from "@/components/product/mockups";
import { ProductFeatures, ProductHero, ProductLimits, ProductProblem, ProductSteps } from "@/components/product/ProductSections";
import { productBySlug, productSlugs } from "@/content/selectors";

type ProductPageProps = { params: Promise<{ slug: string }> };

/** Every product page is generated at build time; any other slug is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return productSlugs().map((slug) => ({ slug }));
}

/** One template for all six products; copy comes from src/content/products/<slug>.ts. */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();
  return (
    <main>
      <ProductHero product={product} Mockup={productMockups[product.slug]} />
      <ProductProblem product={product} />
      <ProductSteps product={product} />
      <ProductFeatures product={product} />
      <ProductLimits product={product} />
    </main>
  );
}
