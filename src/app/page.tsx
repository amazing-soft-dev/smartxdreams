import { HomeHero } from "@/components/home/HomeHero";
import { ProductGrid } from "@/components/home/ProductGrid";
import { CtaSection } from "@/components/sections/CtaSection";

export default function HomePage() {
  return (
    <main>
      <HomeHero />
      <ProductGrid />
      <CtaSection />
    </main>
  );
}
