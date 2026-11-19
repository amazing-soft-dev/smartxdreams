/**
 * What Vercel Web Analytics and Speed Insights may report as the page address.
 *
 * Both report the full address, query string and fragment included. On /waitlist/confirm either can hold the
 * confirmation token, which carries the visitor's email address, so that page is reported by its path alone.
 * Every other address is reported unchanged.
 */

const PRIVATE_PATHS = ["/waitlist/confirm"];

/** The address to report: unchanged, except that a private page loses its query string and fragment. */
export function reportableUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Not an absolute address: cut at the first "?" or "#" rather than report something we cannot read.
    return url.replace(/[?#].*$/, "");
  }
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  if (!PRIVATE_PATHS.includes(path)) return url;
  return `${parsed.origin}${parsed.pathname}`;
}
