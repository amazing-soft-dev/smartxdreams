import { AstraField } from "@/components/astra/AstraField";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Tag } from "@/components/ui/Tag";
import { company } from "@/content/site";
import { SelectionHeadline, type SelectionTarget } from "./SelectionHeadline";

const headline = "Six focused AI products for the work nobody wants to do.";
/** Words the selection box visits (Six, focused, AI, work), each with its chip. */
const targets: SelectionTarget[] = [
  { word: 0, label: { kind: "Portfolio", value: "6 products" } },
  { word: 1, label: { kind: "Scope", value: "one job each" } },
  { word: 2, label: { kind: "Review", value: "a person decides" } },
  { word: 6, label: { kind: "Output", value: "drafts you approve" } },
];

/**
 * The Home hero: a full-height dark stage with a violet and coral glow, the studio tag, the headline and
 * the description. Text is the largest element on screen, so it is also the Largest Contentful Paint.
 */
export function HomeHero() {
  return (
    <section
      aria-labelledby="home-hero-title"
      data-surface="dark"
      data-nav-theme="dark"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-ink pt-32 pb-20 text-white md:pt-40"
    >
      {/* Static CSS stars first; the three.js sky loads on top when the device allows it. */}
      <AstraField />
      <Glow color="violet" size={1100} opacity={0.45} className="-top-1/3 left-1/2 -translate-x-1/2" />
      <Glow color="coral" size={700} opacity={0.3} className="-bottom-1/3 left-[15%]" />
      <Container className="flex flex-col items-center text-center">
        <Reveal aboveFold preset="left60" delay={0.2}>
          <Tag tone="dark">{company.tagline}</Tag>
        </Reveal>
        <Reveal aboveFold delay={0.4} className="w-full">
          <SelectionHeadline id="home-hero-title" text={headline} targets={targets} className="mx-auto mt-10 max-w-4xl text-display" />
        </Reveal>
        <Reveal aboveFold delay={0.5}>
        <p className="mt-6 max-w-2xl text-body-l text-white/65">
          Job searches, applications, site reports, dental bills, paperwork and security questionnaires. Each product
          does one job, shows its sources and leaves the final call to you.
        </p>
        </Reveal>
        <Reveal aboveFold delay={0.6} className="mt-9 flex flex-wrap justify-center gap-3">
          {/* Coral with ink text: 6.54:1. */}
          <Button href="/products" variant="coral" size="lg">
            Explore the products
          </Button>
          <Button href="#how-we-build" variant="ghost" size="lg" icon={false}>
            How we build
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
