import { Button } from "@/components/ui/Button";
import { DigitRoller } from "@/components/ui/DigitRoller";
import { Photo } from "@/components/ui/Photo";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { about } from "@/content/about";
import { aboutStats } from "@/content/selectors";
import { TeamProfiles } from "./TeamProfiles";

/**
 * "Team", laid out like Ignivo's team bento: a wide card about building with the studio, with a few numbers
 * and a way to get in touch, then the people.
 */
export function AboutTeam() {
  const { join } = about.team;
  return (
    <Section labelledBy="team-title" surface="white">
      <SectionHeader id="team-title" tag="Team" title={about.team.title} description={about.team.body} />

      <div className="mt-14 grid overflow-hidden rounded-[30px] bg-ink text-white lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" data-surface="dark">
        <div className="flex flex-col justify-between gap-10 p-8 md:p-10">
          <div>
            <h3 className="text-h3">{join.title}</h3>
            <p className="mt-4 max-w-xl text-body-l text-white/70">{join.body}</p>
          </div>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <dl className="grid grid-cols-3 gap-6">
              {aboutStats().map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <dt className="mt-1 text-micro text-white/65">{stat.short}</dt>
                  <dd className="order-first text-h3 leading-none">
                    <DigitRoller value={String(stat.value)} />
                  </dd>
                </div>
              ))}
            </dl>
            <Button href={join.cta.href} variant="coral" className="self-start md:self-auto">
              {join.cta.label}
            </Button>
          </div>
        </div>
        <div className="relative min-h-64 lg:min-h-full">
          <Photo slot="about-team" fill sizes="(min-width: 1024px) 45vw, 100vw" />
        </div>
      </div>

      <TeamProfiles />
    </Section>
  );
}
