import { Reveal } from "@/components/motion/Reveal";
import {
  AutofillCard,
  BillExplainerCard,
  CostBarCard,
  JobFeedCard,
  QuestionnaireCard,
  SiteReportCard,
} from "@/components/mockups/HeroCards";
import { cx } from "@/lib/cx";

/** Cards in display order, each with its resting offset so the row reads as a wave. */
const cards = [
  { Card: JobFeedCard, offset: "lg:translate-y-10" },
  { Card: AutofillCard, offset: "lg:translate-y-0" },
  { Card: SiteReportCard, offset: "lg:translate-y-14" },
  { Card: CostBarCard, offset: "lg:translate-y-3" },
  { Card: BillExplainerCard, offset: "lg:translate-y-12" },
  { Card: QuestionnaireCard, offset: "lg:translate-y-1" },
];

/**
 * The row of six product mockups under the hero text. On desktop the cards sit at staggered heights and
 * drop in alternately from above and below (spring B, 160 ms apart). Decorative: the products are named
 * and described in text elsewhere on the page.
 */
export function HeroWave() {
  return (
    <div aria-hidden="true" className="mt-16 hidden w-full items-start justify-center gap-2.5 lg:flex">
      {cards.map(({ Card, offset }, i) => (
        <Reveal key={i} aboveFold preset={i % 2 === 0 ? "waveDown" : "waveUp"} delay={0.3 + i * 0.16} className={cx("w-[200px] shrink-0", offset)}>
          <Card />
        </Reveal>
      ))}
    </div>
  );
}
