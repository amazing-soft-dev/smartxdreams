import { HomeCards } from "@/components/home/HomeCards";
import { HomeHero } from "@/components/home/HomeHero";
import { Principles } from "@/components/home/Principles";
import { ProcessStepper } from "@/components/home/ProcessStepper";
import { ProductGrid } from "@/components/home/ProductGrid";
import { Statement } from "@/components/home/Statement";
import { CtaSection } from "@/components/sections/CtaSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { companyFaq } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

const description =
  "SmartxDreams builds six focused AI products: Joined, Acorn, SiteLog, ToothLedger, SeniorAIPlans and TrustDraft. Each does one job, shows its sources and leaves the final call to you.";

export const metadata: Metadata = {
  ...pageMetadata({ title: "AI products for everyday work and life", description, path: "/" }),
  // Home keeps the brand first in the tab and in search results.
  title: { absolute: "SmartxDreams: AI products for everyday work and life" },
};

/**
 * Home. Section order: hero (dark), product previews (dark band), products, statement, how we build,
 * principles, FAQ, closing call to action (dark). Every section declares data-nav-theme, so the header
 * switches between light and dark glass as the visitor scrolls.
 */
export default function HomePage() {
  return (
    <main id="main" tabIndex={-1}>
      <HomeHero />
      <HomeCards />
      <ProductGrid />
      <Statement />
      <ProcessStepper />
      <Principles />
      <FaqSection items={companyFaq} />
      <CtaSection />
    </main>
  );
}
