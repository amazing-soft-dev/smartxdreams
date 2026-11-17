/**
 * How the painted Earth plate is placed in the Home hero at each breakpoint.
 *
 * A breakpoint says where the cloud symbol should sit and how tall it should be; the plate is then scaled and
 * moved to put it there, and grown about the symbol's centre just enough to cover the hero's left, right and
 * bottom edges, so the planet is never cut off. Only the top may be left uncovered, and above the plate is
 * sky anyway. The reference site does the same with object-position and a zoom anchored to the right.
 *
 * Lengths are in hero heights (H), measured from the hero's bottom-left corner with y up, so the placement
 * keeps its shape at any hero height. The scene and the CSS fallback both use these numbers.
 */

import { LANDMARKS, PLATE_ASPECT } from "./plate";

/** Where the cloud symbol's centre goes (`right` from the right edge, `bottom` up from the bottom) and its height. */
export type SymbolTarget = { right: number; bottom: number; height: number };

export type PlateBreakpoint = {
  /** Applies from this viewport width (CSS px) up to the next breakpoint. */
  minWidth: number;
  symbol: SymbolTarget;
};

/**
 * Phone, tablet and desktop. The copy sits over the sky: across the top on phones and tablets, in a left
 * column on desktop. The symbol stays clear of it, low on the right.
 */
export const PLATE_BREAKPOINTS: readonly PlateBreakpoint[] = [
  { minWidth: 0, symbol: { right: 0.2, bottom: 0.2, height: 0.16 } },
  { minWidth: 640, symbol: { right: 0.3, bottom: 0.25, height: 0.22 } },
  { minWidth: 1024, symbol: { right: 0.55, bottom: 0.48, height: 0.4 } },
];

/** The breakpoint in force at a viewport width (CSS px). */
export function plateBreakpointFor(viewportWidth: number): PlateBreakpoint {
  let match = PLATE_BREAKPOINTS[0]!;
  for (const bp of PLATE_BREAKPOINTS) if (viewportWidth >= bp.minWidth) match = bp;
  return match;
}

/** The plate's rectangle in the hero: bottom-left corner and size, in H. */
export type PlateRect = { left: number; bottom: number; width: number; height: number };

/**
 * Places the plate for a hero `aspect` (width / height). The symbol's centre lands on the target, at the
 * target height or larger: the plate grows (about that centre) until its left edge reaches the hero's left
 * edge, its right edge the hero's right edge and its bottom edge the hero's bottom.
 */
export function plateRect(symbol: SymbolTarget, aspect: number): PlateRect {
  const { u: su, v: sv, height: sh } = LANDMARKS.symbol;
  const cx = aspect - symbol.right;
  const cy = symbol.bottom;
  const height = Math.max(
    symbol.height / sh, // the symbol at its target height
    cx / su / PLATE_ASPECT, // left edge at or past the hero's left
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
 * The placement for the CSS fallback, on `selector`: the symbol landmark and the plate's aspect as constants,
 * each breakpoint's symbol target in a media query, and plateRect() itself written in CSS, so the fallback
 * needs no JavaScript to line up with the scene:
 *
 * - `--plate-height`: the plate's height, the largest of the four lengths plateRect() compares
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
    // plateRect(), term by term: the symbol at its target height, then the left, right and bottom edges covered.
    "--plate-height:max(" +
      "calc(var(--plate-symbol-height) / var(--plate-sh) * 100cqh)," +
      "calc((100cqw - var(--plate-symbol-right) * 100cqh) / var(--plate-su) / var(--plate-aspect))," +
      "calc(var(--plate-symbol-right) * 100cqh / (1 - var(--plate-su)) / var(--plate-aspect))," +
      "calc(var(--plate-symbol-bottom) * 100cqh / (1 - var(--plate-sv))))",
    "--plate-left:calc(100cqw - var(--plate-symbol-right) * 100cqh - var(--plate-su) * var(--plate-aspect) * var(--plate-height))",
    "--plate-bottom:calc(var(--plate-symbol-bottom) * 100cqh - (1 - var(--plate-sv)) * var(--plate-height))",
  ].join(";");
  const targets = PLATE_BREAKPOINTS.map(({ minWidth, symbol }) => {
    const rule = `${selector}{--plate-symbol-right:${symbol.right};--plate-symbol-bottom:${symbol.bottom};--plate-symbol-height:${symbol.height}}`;
    return minWidth === 0 ? rule : `@media (min-width:${minWidth}px){${rule}}`;
  });
  return `${selector}{${base}}${targets.join("")}`;
}
