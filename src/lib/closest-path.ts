/** Edit distance between two strings (Levenshtein), with an early exit once it exceeds `max`. */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min((prev[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      row.push(value);
      best = Math.min(best, value);
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length] ?? max + 1;
}

/**
 * The known path closest to a mistyped one, or undefined when nothing is close enough to be a likely typo.
 * Compares lowercase paths without trailing slashes; allows about one edit per four characters (at most 4).
 */
export function closestPath(path: string, known: readonly string[]): string | undefined {
  const target = path.toLowerCase().replace(/\/+$/, "") || "/";
  const max = Math.min(4, Math.max(1, Math.floor(target.length / 4)));
  let best: { path: string; d: number } | undefined;
  for (const candidate of known) {
    if (candidate === target) continue;
    const d = distance(target, candidate, max);
    if (d <= max && (!best || d < best.d)) best = { path: candidate, d };
  }
  return best?.path;
}
