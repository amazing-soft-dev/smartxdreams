/**
 * Edit distance between two strings: insertions, deletions, substitutions and swaps of two neighbouring
 * characters each count as one edit (optimal string alignment), so "/abuot" is one edit from "/about".
 */
function distance(a: string, b: string): number {
  const rows: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  const at = (i: number, j: number) => rows[i]?.[j] ?? Number.POSITIVE_INFINITY;
  for (let i = 1; i <= a.length; i++) {
    const row = rows[i] as number[];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, at(i - 2, j - 2) + 1);
      row[j] = value;
    }
  }
  return at(a.length, b.length);
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
    if (candidate === target || Math.abs(candidate.length - target.length) > max) continue;
    const d = distance(target, candidate);
    if (d <= max && (!best || d < best.d)) best = { path: candidate, d };
  }
  return best?.path;
}
