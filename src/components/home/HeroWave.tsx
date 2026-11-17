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

/** The phone carousel shows the top 200 px of each card, fading out toward the bottom. */
const peek = {
  height: 200,
  maskImage: "linear-gradient(to bottom, #000 70%, transparent)",
  WebkitMaskImage: "linear-gradient(to bottom, #000 70%, transparent)",
};

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
 * drop in alternately from above and below (spring B, 160 ms apart). Below 1024 px they become a sideways
 * snap carousel. Decorative: the products are named and described in text elsewhere on the page.
 */
export function HeroWave() {
  return (
    <>
    <div aria-hidden="true" className="mt-16 hidden w-full items-start justify-center gap-2.5 lg:flex">
      {cards.map(({ Card, offset }, i) => (
        <Reveal key={i} aboveFold preset={i % 2 === 0 ? "waveDown" : "waveUp"} delay={0.3 + i * 0.16} className={cx("w-[200px] shrink-0", offset)}>
          <Card />
        </Reveal>
      ))}
    </div>
    {/* Below 1024 px: one row that scrolls sideways with snap points, so the hero stays short on phones.
        The scroller is focusable so it can be scrolled with the arrow keys; the cards themselves are
        decorative. data-lenis-prevent keeps sideways wheel and trackpad scrolling native. */}
    <div
      role="region"
      aria-label="Product previews, scroll sideways"
      tabIndex={0}
      data-lenis-prevent
      className="-mx-5 mt-8 flex w-[calc(100%+2.5rem)] snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:-mx-10 md:w-[calc(100%+5rem)] md:scroll-px-10 md:px-10 lg:hidden"
    >
      {cards.map(({ Card }, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="w-[min(78vw,280px)] shrink-0 snap-start overflow-hidden"
          // A 200 px peek of each card that fades out, so the hero stays under 900 px tall on phones.
          style={peek}
        >
          <Card />
        </div>
      ))}
    </div>
    </>
  );
}
