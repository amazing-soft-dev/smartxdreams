/** Copy for Home sections that is not product or company copy. */

/**
 * The statement under the product grid. Words are revealed one by one as it scrolls into view.
 * "{chip:<product slug>}" places a small product chip at that point in the sentence.
 */
export const homeStatement = [
  "Most AI tools hand you a blank prompt box.",
  "We build products that do one job each:",
  "{chip:joined} find the job, {chip:acorn} fill the form, {chip:sitelog} write the report, {chip:senioraiplans} explain the letter.",
  "You stay in charge of every decision.",
] as const;
