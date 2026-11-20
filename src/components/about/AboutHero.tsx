import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Tag } from "@/components/ui/Tag";
import { about } from "@/content/about";
import { SplitText } from "@/components/motion/SplitText";

/** The About hero: a dark band with the page title and the one-line description of the studio. */
export function AboutHero() {
  return (
    <section
      aria-labelledby="about-title"
      data-surface="dark"
      data-nav-theme="dark"
      className="relative isolate overflow-hidden bg-ink pt-28 pb-14 text-white md:pt-44 md:pb-28"
    >
      <Glow color="coral" size={820} opacity={0.3} className="-top-1/2 left-1/2 -translate-x-1/2" />
      <Container className="text-center">
        <Tag tone="dark">About</Tag>
        <h1 id="about-title" className="mx-auto mt-6 max-w-4xl text-display">
          <SplitText text={about.hero.title} tone="dark" aboveFold />
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-body-l text-white/70">{about.hero.body}</p>
      </Container>
    </section>
  );
}
