import { Reveal } from "@/components/motion/Reveal";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Accent } from "@/components/ui/Accent";
import { Card } from "@/components/ui/Card";
import { Photo } from "@/components/ui/Photo";
import { PhotoCredits } from "@/components/ui/PhotoCredits";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { about } from "@/content/about";

/** "Team": who is behind the products, and the credits for every photo on the site. */
export function AboutTeam() {
  return (
    <Section labelledBy="team-title" surface="white">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal preset="left60" className="lg:order-last">
          <div className="relative aspect-[3/2] overflow-hidden rounded-[30px]">
            <Photo slot="about-team" fill sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
        </Reveal>
        <div>
          <Tag>Team</Tag>
          <h2 id="team-title" className="mt-5 text-h2">
            <Accent text={about.team.title} />
          </h2>
          <p className="mt-6 max-w-[62ch] text-body-l text-ink/75">{about.team.body}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {about.team.roles.map((role) => (
              <li key={role.title}>
                <Card tone="canvas" className="h-full">
                  <h3 className="text-h6">{role.title}</h3>
                  <p className="mt-2 text-label text-ink/70">{role.body}</p>
                </Card>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-body text-ink/75">
            Want to help build or test a product?{" "}
            <TransitionLink href="/contact" className="font-medium text-ink underline underline-offset-4">
              Get in touch
            </TransitionLink>
            .
          </p>
        </div>
      </div>
      {/* Every photo on the site is credited here, as the Unsplash and Pexels licenses ask. */}
      <PhotoCredits className="mt-20 border-t border-ink/10 pt-10" />
    </Section>
  );
}
