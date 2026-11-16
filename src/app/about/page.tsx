import { Reveal } from "@/components/motion/Reveal";
import { Accent } from "@/components/ui/Accent";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Glow } from "@/components/ui/Glow";
import { Photo } from "@/components/ui/Photo";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
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
    </main>
  );
}
