/**
 * The first sentence of a piece of copy, with its full stop: what a small card shows of a product summary.
 * A text with one sentence comes back whole, so its full stop is never doubled.
 */
export function firstSentence(text: string): string {
  const end = text.indexOf(". ");
  return end === -1 ? text : text.slice(0, end + 1);
}
