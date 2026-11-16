import { Reveal } from "@/components/motion/Reveal";
import { Accent } from "@/components/ui/Accent";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Photo } from "@/components/ui/Photo";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { about } from "@/content/about";

/** /about: the studio's story, how it works, where it is headed and who is behind it. */
export default function AboutPage() {
  return (
    <main>
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
    </main>
  );
}
