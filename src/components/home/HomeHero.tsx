import { EarthField } from "@/components/earth/EarthField";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
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
 * The Home hero, laid out like the generalcontextlabs.com hero: the copy left-aligned over the starfield sky,
 * the painted Earth with the SmartxDreams symbol in its clouds filling the right (see EarthField and
 * docs/earth.md). On phones and tablets the copy sits across the top and the planet rises below it; on phones
 * the hero keeps a band below the copy (88vw, at most 360 px) for the planet, whatever the copy's length.
 *
 * The desktop hero is about twice as wide as it is tall (50vw, at least 660 px, at most the viewport), which is
 * the shape the plate's placement is designed for; it grows if the copy needs more room. Text is the largest
 * element on screen, so it is also the Largest Contentful Paint.
 */
export function HomeHero() {
  return (
    <section
      aria-labelledby="home-hero-title"
      data-surface="dark"
      data-nav-theme="dark"
      className="relative isolate flex items-start overflow-hidden bg-space pt-28 pb-[min(88vw,360px)] text-white md:min-h-[max(720px,100svh)] md:pt-36 md:pb-16 lg:min-h-[clamp(660px,50vw,100svh)] lg:items-center lg:pt-28 lg:pb-24"
    >
      {/* The still sky and plate first; the three.js plate loads on top when the device allows it. */}
      <EarthField />
      {/* Desktop: a soft wash of the sky's own colour behind the copy column, so the sunrise and the glow on the
          limb, which rise close to the description's last lines, never cut its contrast. Phones and tablets keep
          the copy above the planet, on clear sky. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden bg-[radial-gradient(40%_60%_at_20%_50%,rgb(7_1_23/0.65),rgb(7_1_23/0.3)_60%,rgb(7_1_23/0)_100%)] lg:block"
      />
      <Container>
        <div className="max-w-xl lg:max-w-[min(44vw,620px)]">
          <Reveal aboveFold preset="left60" delay={0.2}>
            <Tag tone="dark">{company.tagline}</Tag>
          </Reveal>
          <Reveal aboveFold delay={0.4} className="w-full">
            <SelectionHeadline id="home-hero-title" text={headline} targets={targets} className="mt-7 text-display md:mt-9" />
          </Reveal>
          <Reveal aboveFold delay={0.5}>
            <p className="mt-5 max-w-lg text-body-l text-white/70 md:mt-6">
              Job searches, applications, site reports, dental bills, paperwork and security questionnaires. Each
              product does one job, shows its sources and leaves the final call to you.
            </p>
          </Reveal>
          <Reveal aboveFold delay={0.6} className="mt-7 flex flex-wrap gap-3 md:mt-9">
            {/* Coral with ink text: 6.54:1. */}
            <Button href="/products" variant="coral" size="lg">
              Explore the products
            </Button>
            <Button href="#how-we-build" variant="ghost" size="lg" icon={false} className="max-sm:hidden">
              How we build
            </Button>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
