import { Reveal } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Photo } from "@/components/ui/Photo";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { about } from "@/content/about";

/** "How we work": the four values as numbered cards, beside a photo as tall as the block. */
export function AboutValues() {
  return (
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
                  <span aria-hidden="true" className="font-mono text-label text-ink/70">
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
  );
}
