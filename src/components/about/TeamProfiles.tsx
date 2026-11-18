import { RevealGroup, RevealItem } from "@/components/motion/RevealGroup";
import { Photo } from "@/components/ui/Photo";
import { team } from "@/content/team";
import { PortraitReveal } from "./PortraitReveal";

/**
 * One card per person, as Ignivo's team profiles: an index number, the portrait, name and role, a divider,
 * what they do here and the areas they look after. Three columns on desktop, two on tablets, one on phones.
 * The cards rise in one after another, and each portrait comes up from greyscale (PortraitReveal).
 */
export function TeamProfiles() {
  return (
    <RevealGroup as="ul" aria-label="The team" stagger={0.08} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {team.map((person, i) => (
        <RevealItem as="li" key={person.slug} data-person={person.slug}>
          <article className="flex h-full flex-col rounded-[30px] bg-canvas p-4 pb-6 md:p-5 md:pb-7">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[22px]">
              <PortraitReveal index={i}>
                <Photo slot={person.photo.slot} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" />
              </PortraitReveal>
              <span
                aria-hidden="true"
                className="absolute top-3 left-3 rounded-full bg-white/85 px-2.5 py-1 font-mono text-micro text-ink backdrop-blur"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-5 px-1">
              <h3 className="text-h5">{person.name}</h3>
              <p className="mt-1 text-label font-medium text-violet-600">{person.role}</p>
              <hr className="my-4 border-ink/10" />
              <p className="text-body text-ink/75">{person.bio}</p>
              <ul aria-label={`${person.name} looks after`} className="mt-4 flex flex-wrap gap-2">
                {person.focus.map((area) => (
                  <li key={area} className="rounded-full bg-white px-3 py-1 text-micro font-medium text-ink shadow-tag">
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
