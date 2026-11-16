import type { Metadata } from "next";
import { RoadmapStrip } from "@/components/home/RoadmapStrip";
import { Reveal } from "@/components/motion/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Accent } from "@/components/ui/Accent";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Photo } from "@/components/ui/Photo";
import { PhotoCredits } from "@/components/ui/PhotoCredits";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { about } from "@/content/about";
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
    <main>
      <JsonLd data={aboutJsonLd} />
      <section
        aria-labelledby="about-title"
        data-surface="dark"
        data-nav-theme="dark"
        className="relative isolate overflow-hidden bg-ink pt-36 pb-20 text-white md:pt-44 md:pb-28"
      >
        <Glow color="coral" size={820} opacity={0.3} className="-top-1/2 left-1/2 -translate-x-1/2" />
        <Container className="text-center">
          <Tag tone="dark">About</Tag>
          <h1 id="about-title" className="mx-auto mt-6 max-w-4xl text-display">
            <Accent text={about.hero.title} tone="dark" />
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-l text-white/70">{about.hero.body}</p>
        </Container>
      </section>

      <Section labelledBy="story-title" surface="canvas">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Tag>Our story</Tag>
            <h2 id="story-title" className="mt-5 text-h2">
              <Accent text={about.story.title} />
            </h2>
            <div className="mt-6 flex max-w-[62ch] flex-col gap-5 text-body-l text-ink/75">
              {about.story.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <Reveal preset="right60">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[30px]">
              <Photo slot="about-story" fill sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          </Reveal>
        </div>
      </Section>

      <Section labelledBy="values-title" surface="white">
        <SectionHeader
          id="values-title"
          tag="How we work"
          title="Four rules we *keep*."
          description="They shape every product, every page and every email we send."
        />
        {/* On desktop the photo stretches to the height of the 2 × 2 block of values beside it. */}
        <div className="mt-14 grid gap-3 lg:grid-cols-3">
          <div className="relative min-h-72 overflow-hidden rounded-card">
            <Photo slot="about-values" fill sizes="(min-width: 1024px) 33vw, 100vw" />
          </div>
          <ul className="grid gap-3 md:grid-cols-2 lg:col-span-2">
            {about.values.map((value, i) => (
              <li key={value.title}>
                <Reveal delay={i * 0.08} className="h-full">
                  <Card tone="canvas" padding="lg" className="h-full">
                    <span aria-hidden="true" className="font-mono text-label text-ink/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-6 text-h5">{value.title}</h3>
                    <p className="mt-3 text-body text-ink/70">{value.body}</p>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section labelledBy="roadmap-title" surface="canvas">
        <SectionHeader
          id="roadmap-title"
          tag="Roadmap"
          title="Where we are *headed*."
          description="Only the first step is true today. The rest are plans, so they carry no dates."
        />
        <RoadmapStrip showHeading={false} className="mt-14" />
      </Section>

      <Section labelledBy="team-title" surface="white">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal preset="left60" className="lg:order-last">
            <div className="relative aspect-[3/2] overflow-hidden rounded-[30px]">
              <Photo slot="about-team" fill sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          </Reveal>
          <div>
            <Tag>Team</Tag>
            <h2 id="team-title" className="mt-5 text-h2">
              <Accent text={about.team.title} />
            </h2>
            <p className="mt-6 max-w-[62ch] text-body-l text-ink/75">{about.team.body}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {about.team.roles.map((role) => (
                <li key={role.title}>
                  <Card tone="canvas" className="h-full">
                    <h3 className="text-h6">{role.title}</h3>
                    <p className="mt-2 text-label text-ink/70">{role.body}</p>
                  </Card>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-body text-ink/75">
              Want to help build or test a product?{" "}
              <TransitionLink href="/contact" className="font-medium text-ink underline underline-offset-4">
                Get in touch
              </TransitionLink>
              .
            </p>
          </div>
        </div>
        {/* Every photo on the site is credited here, as the Unsplash and Pexels licenses ask. */}
        <PhotoCredits className="mt-20 border-t border-ink/10 pt-10" />
      </Section>
    </main>
  );
}
