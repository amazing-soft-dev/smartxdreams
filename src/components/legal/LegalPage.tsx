import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import type { LegalBlock, LegalDocument } from "@/content/legal/types";

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p className="mt-4 text-body text-ink/80">{block}</p>;
  return (
    <ul className="mt-4 flex list-disc flex-col gap-2.5 pl-5 text-body text-ink/80 marker:text-violet-500">
      {block.list.map((item) => (
        <li key={item} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * A legal page: title, a visible draft note, a contents list and the sections at a 68-character measure.
 * On desktop the contents list stays in view beside the text. Every section has an anchor, so a form or an
 * email can link straight to, say, /privacy#your-rights.
 */
export function LegalPage({ doc }: { doc: LegalDocument }) {
  const date = longDate.format(new Date(`${doc.draftDate}T00:00:00Z`));
  return (
    <main id="main" tabIndex={-1}>
      <section aria-labelledby="legal-title" data-nav-theme="light" className="bg-canvas pt-36 pb-14 md:pt-44 md:pb-16">
        <Container>
          <Tag>Legal</Tag>
          <h1 id="legal-title" className="mt-6 text-h2">
            {doc.title}
          </h1>
          <p className="mt-4 max-w-[60ch] text-body-l text-ink/70">{doc.summary}</p>
          <p role="note" className="mt-8 max-w-[68ch] rounded-bar border border-coral-600/50 bg-coral-50 px-5 py-4 text-label text-ink">
            <strong className="font-semibold">Draft for legal review.</strong> A lawyer has not reviewed this text yet, and it may change
            before launch. It describes how the website works today. Draft of <time dateTime={doc.draftDate}>{date}</time>.
          </p>
        </Container>
      </section>

      <Section surface="white" as="div">
        <div className="grid gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-labelledby="legal-contents" className="self-start lg:sticky lg:top-28">
            <h2 id="legal-contents" className="text-label font-medium text-ink">
              On this page
            </h2>
            <ol className="mt-4 flex flex-col border-l border-ink/10">
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px inline-flex min-h-11 items-center border-l border-transparent pl-4 text-label text-ink/70 transition-colors hover:border-ink hover:text-ink"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <article className="max-w-[68ch]">
            {doc.sections.map((section, i) => (
              <section key={section.id} aria-labelledby={section.id} className={i === 0 ? undefined : "mt-12"}>
                <h2 id={section.id} className="scroll-mt-28 text-h5">
                  {section.title}
                </h2>
                {section.blocks.map((block, j) => (
                  <Block key={j} block={block} />
                ))}
              </section>
            ))}
          </article>
        </div>
      </Section>
    </main>
  );
}
