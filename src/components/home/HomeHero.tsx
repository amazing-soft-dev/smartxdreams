import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Tag } from "@/components/ui/Tag";
import { company } from "@/content/site";

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
      <Glow color="violet" size={1100} opacity={0.45} className="-top-1/3 left-1/2 -translate-x-1/2" />
      <Glow color="coral" size={700} opacity={0.3} className="-bottom-1/3 left-[15%]" />
      <Container className="flex flex-col items-center text-center">
        <Tag tone="dark">{company.tagline}</Tag>
        <h1 id="home-hero-title" className="mt-6 max-w-4xl text-display">
          Six focused AI products for the work nobody wants to do.
        </h1>
        <p className="mt-6 max-w-2xl text-body-l text-white/65">
          Job searches, applications, site reports, dental bills, paperwork and security questionnaires. Each product
          does one job, shows its sources and leaves the final call to you.
        </p>
      </Container>
    </section>
  );
}
