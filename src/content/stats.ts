/**
 * Numbers the Home page may show. Every value is null until there is a real, checkable figure behind it,
 * and a null stat is never rendered. Do not fill these with estimates or targets.
 *
 * When a number becomes real, set its value and note where it comes from in `source`.
 */
export type Stat = {
  label: string;
  /** The number to show, e.g. 1200. null hides the stat. */
  value: number | null;
  /** Shown after the number, e.g. "+" or "%". */
  suffix?: string;
  /** Where the number comes from (for the team, not shown on the site). */
  source?: string;
};

export const homeStats: Stat[] = [
  { label: "People on our waitlists", value: null },
  { label: "Products in private beta", value: null },
  { label: "Hours saved per user each week, measured in beta", value: null },
];

/** Only stats with a real value. */
export const visibleStats = (): Stat[] => homeStats.filter((s) => s.value !== null);
