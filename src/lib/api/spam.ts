/**
 * Cheap bot filters that cost people nothing:
 * - a honeypot: a field hidden from people and assistive tech; bots that fill every input fill it too;
 * - a time trap: people take seconds to fill in a form, scripts post at once.
 *
 * A caught submission is answered exactly like a real one (success, no email sent), so a bot learns nothing.
 */

/** Faster than this from form load to submit is treated as automated. */
export const MIN_FILL_MS = 2_500;

export type SpamVerdict = "honeypot" | "too-fast" | "no-timer" | null;

/** Why a submission looks automated, or null when it looks human. */
export function spamVerdict({ website, elapsedMs }: { website?: string; elapsedMs?: number }): SpamVerdict {
  if (website && website.trim() !== "") return "honeypot";
  // Our forms always send the timer; a body without it did not come from them.
  if (elapsedMs === undefined) return "no-timer";
  if (elapsedMs < MIN_FILL_MS) return "too-fast";
  return null;
}
