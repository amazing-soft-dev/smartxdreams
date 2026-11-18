import type { Metadata } from "next";
import { AboutCredits } from "@/components/about/AboutCredits";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutRoadmap } from "@/components/about/AboutRoadmap";
import { AboutStats } from "@/components/about/AboutStats";
import { AboutStory } from "@/components/about/AboutStory";
import { AboutTeam } from "@/components/about/AboutTeam";
import { AboutValues } from "@/components/about/AboutValues";
import { ProductStrip } from "@/components/home/ProductStrip";
import { JsonLd } from "@/components/seo/JsonLd";
import { company } from "@/content/site";
import { absoluteUrl, pageMetadata, siteUrl, teamJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Why SmartxDreams builds one focused AI product per everyday problem, the rules we work by, where we are headed and who is behind it.",
  path: "/about",
});

/**
 * schema.org AboutPage pointing at the Organization from the root layout. Its main entity is that
 * Organization (by @id, so the two merge) with the team as its employees.
 */
const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: `About ${company.name}`,
  url: absoluteUrl("/about"),
  about: { "@id": `${siteUrl}/#organization` },
  isPartOf: { "@id": `${siteUrl}/#website` },
  mainEntity: { "@type": "Organization", "@id": `${siteUrl}/#organization`, employee: teamJsonLd() },
};

/** /about: the studio's story, how it works, where it is headed and who is behind it. */
export default function AboutPage() {
  return (
    <main id="main" tabIndex={-1}>
      <JsonLd data={aboutJsonLd} />
      <AboutHero />
      <AboutStory />
      <AboutStats />
      <AboutValues />
      <AboutRoadmap />
      <AboutTeam />
      {/* Where Ignivo closes its About page with its partners' logos: the products this team is building. */}
      <ProductStrip label="What the team is building" />
      <AboutCredits />
    </main>
  );
}
