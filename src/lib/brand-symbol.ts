/**
 * Geometry of the SmartxDreams stroke symbol (also drawn by src/app/icon.svg): an S (top) and a D (bottom)
 * drawn as two 18-unit strokes that pass over and under each other. Kept apart from the Logo component so any
 * code that needs the mark's geometry draws the same symbol.
 *
 * Units are the master SVG's user units. `viewBox` is cropped from the master's padded 390-unit square to the
 * strokes themselves, so a height in px is the height of the artwork.
 */
export const SYMBOL = {
  viewBox: "216 116 168 273",
  /** The cropped viewBox as numbers: x, y, width, height. */
  box: { x: 216, y: 116, width: 168, height: 273 },
  ratio: 168 / 273,
  s: "M384 125H300A75 75 0 1 0 375 200",
  d: "M225 380V305A75 75 0 1 1 300 380Z",
  stroke: 18,
  /** Where the S crosses over the D (right) and the D over the S (left); the strokes underneath are cut there. */
  crossings: { overD: { cx: 353.56, cy: 252.5 }, overS: { cx: 246.44, cy: 252.5 } },
  crossingRadius: 36,
  /** Width of the cut: the stroke plus a 7-unit gap on each side. */
  cut: 32,
} as const;

/** The master SVG's full, padded square, used as the mask area for the crossing cuts. */
export const SYMBOL_MASK_BOX = { x: 105, y: 57.5, width: 390, height: 390 } as const;
