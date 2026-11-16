const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "2026-11-15" -> "15 Nov 2026". */
export function formatPostDate(isoDate: string): string {
  return shortDate.format(new Date(`${isoDate}T00:00:00Z`));
}

/** Card and header meta line: "15 Nov 2026 · 3 min read". */
export function postMeta(post: { date: string; readingMinutes: number }): string {
  return `${formatPostDate(post.date)} · ${post.readingMinutes} min read`;
}
