import { Container } from "@/components/ui/Container";
import { DigitRoller } from "@/components/ui/DigitRoller";
import { aboutStats } from "@/content/selectors";

/**
 * A band of numbers after the story, as Ignivo's About page has. Each rolls up from 0 the first time the
 * band scrolls into view (DigitRoller); with reduced motion the numbers are simply there. Every number is counted from the site's
 * own content (the team list, its groups, the product catalogue), so it can never drift from the page.
 */
export function AboutStats() {
  return (
    <section aria-label="SmartxDreams in numbers" data-surface="dark" data-nav-theme="dark" className="bg-ink py-16 text-white md:py-20">
      <Container>
        <dl className="grid gap-10 text-center sm:grid-cols-3 sm:gap-6">
          {aboutStats().map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              {/* The label comes first for screen readers; the number shows above it. */}
              <dt className="mt-3 text-label text-white/70">{stat.label}</dt>
              <dd className="order-first text-[clamp(3rem,2rem+3vw,4.5rem)] leading-none font-medium tracking-[-0.03em]">
                <DigitRoller value={String(stat.value)} />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
