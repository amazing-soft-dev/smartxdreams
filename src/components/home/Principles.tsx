import { Reveal } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { company } from "@/content/site";
import { HonestStats } from "./HonestStats";

/** Small line icons for the three principles, in order. Decorative. */
const icons = [
  // A person: stays in charge.
  "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6a5 5 0 0 1 10 0",
  // A document with a check: answers show their source.
  "M4 1.5h5.5L13 5v9.5H4V1.5Zm5 0V5h4M6.5 10l1.5 1.5 3-3",
  // A lock: your data stays yours.
  "M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v7h-9V7Z",
];

/**
 * How the studio builds: three principles that every product follows. These are commitments, not claims
 * about results, so nothing here needs a number to back it up.
 */
export function Principles() {
  return (
    <Section labelledBy="principles-title" surface="white">
      <SectionHeader
        id="principles-title"
        tag="Principles"
        title="Built to be *trusted*, not just impressive."
        description="Every SmartxDreams product follows the same three rules."
      />
      <ul className="mt-14 grid gap-3 md:grid-cols-3">
        {company.principles.map((principle, i) => (
          <li key={principle.title}>
            <Reveal delay={i * 0.08} className="h-full">
              <Card tone="canvas" padding="lg" className="h-full">
                <span aria-hidden="true" className="inline-flex size-11 items-center justify-center rounded-xl bg-ink text-white">
                  <svg viewBox="0 0 16 16" width="18" height="18" fill="none">
                    <path d={icons[i]} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h3 className="mt-6 text-h5">{principle.title}</h3>
                <p className="mt-3 text-body text-ink/70">{principle.body}</p>
              </Card>
            </Reveal>
          </li>
        ))}
      </ul>
      {/* Real numbers only: hidden until src/content/stats.ts has a sourced value. */}
      <HonestStats />
    </Section>
  );
}
