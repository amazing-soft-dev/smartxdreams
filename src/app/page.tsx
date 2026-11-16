import { HomeHero } from "@/components/home/HomeHero";
import { Principles } from "@/components/home/Principles";
import { ProcessStepper } from "@/components/home/ProcessStepper";
import { ProductGrid } from "@/components/home/ProductGrid";
import { Statement } from "@/components/home/Statement";
import { CtaSection } from "@/components/sections/CtaSection";

/**
 * Home. Section order: hero (dark), products, statement, how we build, principles, FAQ, closing call to
 * action (dark). Every section declares data-nav-theme, so the header switches between light and dark
 * glass as the visitor scrolls.
 */
export default function HomePage() {
  return (
    <main>
      <HomeHero />
      <ProductGrid />
      <Statement />
      <ProcessStepper />
      <Principles />
      <CtaSection />
    </main>
  );
}
