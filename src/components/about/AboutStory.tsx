import { Reveal } from "@/components/motion/Reveal";
import { Photo } from "@/components/ui/Photo";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { about } from "@/content/about";
import { PhotoReveal } from "@/components/motion/PhotoReveal";
import { WordReveal } from "@/components/motion/WordReveal";

/** "Our story": why the studio started, beside a photo that slides in from the right. */
export function AboutStory() {
  return (
    <Section labelledBy="story-title" surface="canvas">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeader id="story-title" tag="Our story" title={about.story.title} align="left" />
          <div className="mt-6 flex max-w-[62ch] flex-col gap-5 text-body-l text-ink/75">
            {/* Each paragraph sharpens word by word as it is reached, like the home statement. */}
            {about.story.paragraphs.map((p) => (
              <WordReveal key={p} text={p} amount={0.3} />
            ))}
          </div>
        </div>
        <Reveal preset="right60">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[30px]">
            <PhotoReveal>
              <Photo slot="about-story" fill sizes="(min-width: 1024px) 45vw, 100vw" />
            </PhotoReveal>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
