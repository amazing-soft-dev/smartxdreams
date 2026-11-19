/**
 * Reads the token from a waitlist confirmation link.
 *
 * The link is /waitlist/confirm#token=…. The token holds the email address and works for 7 days, and a
 * browser never sends the fragment (the part after "#") with a request, so there it stays out of request
 * logs and Referer headers. Links emailed before the token moved have it in the query string (?token=…)
 * and keep working until they expire.
 */

const tokenIn = (part: string) => new URLSearchParams(part.replace(/^[#?]/, "")).get("token");

/** The token from the confirm page's address: the fragment first, then the query string; null without one. */
export function tokenFromLocation(hash: string, search: string): string | null {
  return tokenIn(hash) || tokenIn(search) || null;
}
