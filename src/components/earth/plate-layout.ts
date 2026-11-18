/**
 * How the painted Earth plate is placed in the Home hero at each breakpoint.
 *
 * A breakpoint says where the cloud symbol should sit and how tall it should be; the plate is then scaled and
 * moved to put it there, and grown about the symbol's centre just enough that the planet is never cut off:
 * the plate covers the hero's right and bottom edges, and on the left it either covers the hero's left edge or
 * sits so low that the planet along its own left edge is below the hero (beside it is then only sky, so the
 * plate may start partway across). The top may be left uncovered; above the plate is sky. The reference site
 * does much the same with object-position and a zoom anchored to the right.
 *
 * Lengths are in hero heights (H), measured from the hero's bottom-left corner with y up, so the placement
 * keeps its shape at any hero height. The scene and the CSS fallback both use these numbers.
 */

import { horizonV, LANDMARKS, PLATE_ASPECT } from "./plate";

/** Where the cloud symbol's centre goes (`right` from the right edge, `bottom` up from the bottom) and its height. */
export type SymbolTarget = { right: number; bottom: number; height: number };

export type PlateBreakpoint = {
  /** A short name, for tests and docs. */
  name: string;
  /** Applies from this viewport width (CSS px)... */
  minWidth: number;
  /** ...and, when set, only from this viewport aspect (width / height) up. */
  minAspect?: number;
  symbol: SymbolTarget;
};

/**
 * From phones to ultrawides, in cascade order: the last breakpoint that matches the viewport wins, as the
 * fallback's media queries do. The copy sits over the sky: across the top on phones and tablets, in a left
 * column on desktops and landscape phones. The emblem stays clear of it, low on the right. Where the copy is a
 * column, the planet rises from the bottom of the copy column to the right edge, so the limb passes under the
 * copy instead of through it.
 *
 * Width alone cannot tell a 4:3 laptop from a 21:9 ultrawide, a phone on its side or a large tablet held
 * upright, so the shapes are picked by aspect too. A wide hero has room on the right for a larger emblem; the
 * targets grow with it. The desktop column needs a landscape window: a 1024 × 1366 tablet held upright keeps
 * the tablet's copy across the top (HomeHero's `desktop` variant matches the same query).
 */
export const PLATE_BREAKPOINTS: readonly PlateBreakpoint[] = [
  // Phone: the hero keeps a band below the copy for the planet (HomeHero), and the emblem sits in it.
  { name: "phone", minWidth: 0, symbol: { right: 0.17, bottom: 0.17, height: 0.14 } },
  { name: "tablet", minWidth: 640, symbol: { right: 0.3, bottom: 0.18, height: 0.3 } },
  // A phone on its side (or a short window): too short for the copy across the top, so the copy is a left
  // column, as on desktop (HomeHero's landscape-phone variant).
  { name: "landscape phone", minWidth: 640, minAspect: 1.6, symbol: { right: 0.36, bottom: 0.22, height: 0.3 } },
  { name: "desktop", minWidth: 1024, minAspect: 1, symbol: { right: 0.3, bottom: 0.2, height: 0.3 } },
  // 21:9 ultrawides and very short laptops.
  { name: "wide", minWidth: 1024, minAspect: 2.2, symbol: { right: 0.34, bottom: 0.2, height: 0.34 } },
  // 32:9 super-ultrawides.
  { name: "ultrawide", minWidth: 1024, minAspect: 2.9, symbol: { right: 0.44, bottom: 0.3, height: 0.44 } },
];

/** Height (v) of the limb at the plate's left edge: below it, the planet runs down that edge. */
const LIMB_AT_LEFT = horizonV(0);

/**
 * The breakpoint in force for a viewport (CSS px). Without a height, only the width counts and the aspect
 * breakpoints are skipped.
 */
export function plateBreakpointFor(viewportWidth: number, viewportHeight?: number): PlateBreakpoint {
  const aspect = viewportHeight ? viewportWidth / viewportHeight : 0;
  let match = PLATE_BREAKPOINTS[0]!;
  for (const bp of PLATE_BREAKPOINTS) {
    if (viewportWidth >= bp.minWidth && (bp.minAspect === undefined || aspect >= bp.minAspect)) match = bp;
  }
  return match;
}

/** The plate's rectangle in the hero: bottom-left corner and size, in H. */
export type PlateRect = { left: number; bottom: number; width: number; height: number };

/**
 * Places the plate for a hero `aspect` (width / height). The symbol's centre lands on the target, at the
 * target height or larger: the plate grows (about that centre) until its right edge reaches the hero's right
 * edge and its bottom edge the hero's bottom, and until either its left edge reaches the hero's left edge or
 * the planet along its left edge (from the limb down) is below the hero's bottom.
 */
export function plateRect(symbol: SymbolTarget, aspect: number): PlateRect {
  const { u: su, v: sv, height: sh } = LANDMARKS.symbol;
  const cx = aspect - symbol.right;
  const cy = symbol.bottom;
  const height = Math.max(
    symbol.height / sh, // the symbol at its target height
    Math.min(
      cx / su / PLATE_ASPECT, // left edge at or past the hero's left, or
      cy / (LIMB_AT_LEFT - sv), // the planet along the left edge below the hero's bottom
    ),
    symbol.right / (1 - su) / PLATE_ASPECT, // right edge at or past the hero's right
    cy / (1 - sv), // bottom edge at or below the hero's bottom
  );
  const width = height * PLATE_ASPECT;
  return { left: cx - su * width, bottom: cy - (1 - sv) * height, width, height };
}

/** Plate coordinates (u right, v down, 0..1) of a hero point (x, y in H from the bottom-left). */
export function heroToPlate(rect: PlateRect, x: number, y: number): { u: number; v: number } {
  return { u: (x - rect.left) / rect.width, v: (rect.bottom + rect.height - y) / rect.height };
}

/** Hero point (x, y in H from the bottom-left) of plate coordinates. */
export function plateToHero(rect: PlateRect, u: number, v: number): { x: number; y: number } {
  return { x: rect.left + u * rect.width, y: rect.bottom + rect.height - v * rect.height };
}

/** Shader uniform for the plate: left, bottom, width and height in H. */
export function plateUniform(rect: PlateRect): [number, number, number, number] {
  return [rect.left, rect.bottom, rect.width, rect.height];
}

const round = (n: number) => Number(n.toFixed(5));

/**
 * The media query a breakpoint applies in, or "" for the first (it applies everywhere). The aspect is written
 * as a ratio over 1000 (`min-aspect-ratio` takes integers).
 */
export function plateMediaQuery({ minWidth, minAspect }: PlateBreakpoint): string {
  const parts: string[] = [];
  if (minWidth > 0) parts.push(`(min-width:${minWidth}px)`);
  if (minAspect !== undefined) parts.push(`(min-aspect-ratio:${Math.round(minAspect * 1000)}/1000)`);
  return parts.join(" and ");
}

/**
 * The placement for the CSS fallback, on `selector`: the symbol landmark and the plate's aspect as constants,
 * each breakpoint's symbol target in a media query, and plateRect() itself written in CSS, so the fallback
 * needs no JavaScript to line up with the scene:
 *
 * - `--plate-height`: the plate's height, the largest of the lengths plateRect() compares
 * - `--plate-left`, `--plate-bottom`: its bottom-left corner
 *
 * They use container query units, so the element must sit in a size container the size of the hero
 * (100cqh is one hero height, 100cqw the hero's width).
 */
export function plateLayoutCss(selector: string): string {
  const { u, v, height } = LANDMARKS.symbol;
  const base = [
    `--plate-su:${round(u)}`,
    `--plate-sv:${round(v)}`,
    `--plate-sh:${round(height)}`,
    `--plate-aspect:${round(PLATE_ASPECT)}`,
    `--plate-limb-left:${round(LIMB_AT_LEFT)}`,
    // plateRect(), term by term: the symbol at its target height; the left edge covered or the planet along it
    // below the bottom; then the right and bottom edges covered.
    "--plate-height:max(" +
      "calc(var(--plate-symbol-height) / var(--plate-sh) * 100cqh)," +
      "min(calc((100cqw - var(--plate-symbol-right) * 100cqh) / var(--plate-su) / var(--plate-aspect))," +
      "calc(var(--plate-symbol-bottom) * 100cqh / (var(--plate-limb-left) - var(--plate-sv))))," +
      "calc(var(--plate-symbol-right) * 100cqh / (1 - var(--plate-su)) / var(--plate-aspect))," +
      "calc(var(--plate-symbol-bottom) * 100cqh / (1 - var(--plate-sv))))",
    "--plate-left:calc(100cqw - var(--plate-symbol-right) * 100cqh - var(--plate-su) * var(--plate-aspect) * var(--plate-height))",
    "--plate-bottom:calc(var(--plate-symbol-bottom) * 100cqh - (1 - var(--plate-sv)) * var(--plate-height))",
  ].join(";");
  const targets = PLATE_BREAKPOINTS.map((bp) => {
    const { symbol } = bp;
    const rule = `${selector}{--plate-symbol-right:${symbol.right};--plate-symbol-bottom:${symbol.bottom};--plate-symbol-height:${symbol.height}}`;
    const query = plateMediaQuery(bp);
    return query ? `@media ${query}{${rule}}` : rule;
  });
  return `${selector}{${base}}${targets.join("")}`;
}
