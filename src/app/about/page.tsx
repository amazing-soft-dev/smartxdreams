import type { Metadata } from "next";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutRoadmap } from "@/components/about/AboutRoadmap";
import { AboutStats } from "@/components/about/AboutStats";
import { AboutStory } from "@/components/about/AboutStory";
import { AboutTeam } from "@/components/about/AboutTeam";
import { AboutValues } from "@/components/about/AboutValues";
import { JsonLd } from "@/components/seo/JsonLd";
import { company } from "@/content/site";
import { absoluteUrl, pageMetadata, siteUrl } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Why SmartxDreams builds one focused AI product per everyday problem, the rules we work by, where we are headed and who is behind it.",
  path: "/about",
});

/** schema.org AboutPage pointing at the Organization from the root layout. */
const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: `About ${company.name}`,
  url: absoluteUrl("/about"),
  about: { "@id": `${siteUrl}/#organization` },
  isPartOf: { "@id": `${siteUrl}/#website` },
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
    </main>
  );
}
