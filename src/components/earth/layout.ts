/**
 * Where the planet sits behind the Home hero.
 *
 * Every length is in hero heights ("H"), measured from the hero's bottom-right corner, so the planet keeps its
 * shape at any height and a wider screen only adds sky on the left (the reference anchors its painting to the
 * right edge the same way). The WebGL scene and the CSS fallback both read these numbers, so the two line up
 * when the scene takes over.
 */

/** The planet described the way a designer places it: where its limb crosses the hero's edges. */
export type PlanetSpec = {
  /** Height (H) at which the limb meets the hero's right edge. */
  edgeY: number;
  /** Distance (H) from the right edge to where the limb meets the bottom edge. */
  baseX: number;
  /** How far (H) the planet's centre sits beyond the right edge. */
  overhang: number;
};

/**
 * Where the SmartxDreams symbol is drawn in cloud: its centre (`right` from the right edge, `bottom` up from
 * the bottom edge), the height of the artwork, and a tilt in degrees (positive turns it counter-clockwise).
 */
export type SymbolPlacement = { right: number; bottom: number; height: number; tilt: number };

/** A cyclone over the ocean: centre (`right`, `bottom`) and radius, in H. */
export type StormPlacement = { right: number; bottom: number; radius: number };

/** The same planet as a circle: centre at (width/H - right, -bottom), radius `radius`, all in H. */
export type PlanetCircle = { right: number; bottom: number; radius: number };

export type EarthBreakpoint = {
  /** Applies from this viewport width (CSS px) up to the next breakpoint. */
  minWidth: number;
  planet: PlanetSpec;
  /**
   * Where the sun is about to rise: an angle on the limb in degrees, counter-clockwise from "right" around
   * the planet's centre. The sunrise flare sits there, and the planet is lit from that side.
   */
  sunAngle: number;
  /** The cloud symbol, at the bottom right of the planet, clear of the copy and the product cards. */
  symbol: SymbolPlacement;
  /** The cyclone, somewhere on the planet the copy, the cards and the symbol leave visible. */
  storm: StormPlacement;
};

/**
 * Phone, tablet and desktop. The hero is taller than wide on phones, so the planet there is a flatter arc low
 * in the frame; on desktop it rises to the top right, clear of the headline's left half.
 */
export const EARTH_BREAKPOINTS: readonly EarthBreakpoint[] = [
  // Phone: a low, wide arc that passes under the description and behind the button, with the sun just past
  // the right edge so only its glow reaches in.
  // The symbol is small, in the one patch of planet the copy and cards leave free: right of the button,
  // just above the card carousel.
  {
    minWidth: 0,
    planet: { edgeY: 0.42, baseX: 1.2, overhang: 0.3 },
    sunAngle: 94,
    symbol: { right: 0.04, bottom: 0.335, height: 0.085, tilt: -6 },
    storm: { right: 0.25, bottom: 0.12, radius: 0.06 },
  },
  // Tablet: the symbol sits in the open ocean below the card carousel.
  {
    minWidth: 640,
    planet: { edgeY: 0.82, baseX: 0.95, overhang: 0.2 },
    sunAngle: 108,
    symbol: { right: 0.14, bottom: 0.11, height: 0.17, tilt: -10 },
    storm: { right: 0.5, bottom: 0.1, radius: 0.07 },
  },
  // Desktop: sunrise just under the header, above the headline; the symbol to the right of the headline,
  // above the cards.
  {
    minWidth: 1024,
    planet: { edgeY: 1.02, baseX: 0.92, overhang: 0.08 },
    sunAngle: 118,
    symbol: { right: 0.15, bottom: 0.62, height: 0.27, tilt: -12 },
    storm: { right: 0.1, bottom: 0.84, radius: 0.075 },
  },
];

/**
 * Solves the circle through the two limb points of `spec` whose centre sits `overhang` beyond the right edge.
 * With the right edge at x = 0 and the bottom at y = 0, the centre is (o, -b) and the limb passes through
 * (0, edgeY) and (-baseX, 0):
 *   o² + (edgeY + b)² = r²  and  (baseX + o)² + b² = r²
 * Subtracting the two gives b; either equation then gives r.
 */
export function planetCircle({ edgeY, baseX, overhang }: PlanetSpec): PlanetCircle {
  if (edgeY <= 0 || baseX <= 0 || overhang < 0) throw new RangeError("planet spec must be positive");
  const run = baseX + overhang;
  const bottom = (run * run - overhang * overhang - edgeY * edgeY) / (2 * edgeY);
  return { right: -overhang, bottom, radius: Math.hypot(run, bottom) };
}

/** The breakpoint in force at a viewport width (CSS px). */
export function earthLayoutFor(viewportWidth: number): EarthBreakpoint {
  let match = EARTH_BREAKPOINTS[0]!;
  for (const bp of EARTH_BREAKPOINTS) if (viewportWidth >= bp.minWidth) match = bp;
  return match;
}

/**
 * Height (H) of the limb at `fromRight` H to the left of the right edge, or null where the planet does not
 * reach that column. Used by tests to check the planet stays clear of the copy.
 */
export function limbHeightAt(circle: PlanetCircle, fromRight: number): number | null {
  const dx = fromRight - circle.right; // horizontal distance from the centre, which sits at x = -right
  const span = circle.radius * circle.radius - dx * dx;
  if (span < 0) return null;
  return Math.sqrt(span) - circle.bottom;
}

/**
 * The sun sits a little in front of the planet (toward the viewer), so the visible cap is in daylight and the
 * sun itself rises behind the limb. This is the view-space z of the unit vector toward it.
 */
export const SUN_FRONT = 0.6;

/** Unit vector toward the sun in view space (x right, y up, z toward the viewer) for a limb angle. */
export function sunDirection(sunAngle: number): [number, number, number] {
  const a = (sunAngle * Math.PI) / 180;
  const across = Math.sqrt(1 - SUN_FRONT * SUN_FRONT);
  return [Math.cos(a) * across, Math.sin(a) * across, SUN_FRONT];
}

/** Shader uniform for the planet: centre x and y (H, origin bottom-left) and radius, for a width/height ratio. */
export function planetUniform(circle: PlanetCircle, aspect: number): [number, number, number] {
  return [aspect - circle.right, -circle.bottom, circle.radius];
}

/**
 * Shader uniform for the cloud symbol: centre x and y (H, origin bottom-left), the side of the square mask in
 * H (the artwork covers `coverage` of it, see symbol-mask.ts), and the tilt in radians.
 */
export function symbolUniform(
  symbol: SymbolPlacement,
  aspect: number,
  coverage: number,
): [number, number, number, number] {
  return [aspect - symbol.right, symbol.bottom, symbol.height / coverage, (symbol.tilt * Math.PI) / 180];
}

/** Shader uniform for the cyclone: centre x and y (H, origin bottom-left) and radius. */
export function stormUniform(storm: StormPlacement, aspect: number): [number, number, number] {
  return [aspect - storm.right, storm.bottom, storm.radius];
}

const round = (n: number) => Number(n.toFixed(4));

/**
 * Custom properties for the CSS fallback, one rule per breakpoint: `--earth-right`, `--earth-bottom` and
 * `--earth-radius` (unitless H, turned into lengths with container query units), and `--earth-sun-x` and
 * `--earth-sun-y`, the direction from the centre to the sunrise on the limb, and the symbol's placement as
 * `--earth-symbol-right`, `--earth-symbol-bottom`, `--earth-symbol-height` (H) and `--earth-symbol-tilt` (deg).
 */
export function earthLayoutCss(selector: string): string {
  return EARTH_BREAKPOINTS.map(({ minWidth, planet, sunAngle, symbol }) => {
    const c = planetCircle(planet);
    const a = (sunAngle * Math.PI) / 180;
    const vars = {
      "--earth-right": c.right,
      "--earth-bottom": c.bottom,
      "--earth-radius": c.radius,
      "--earth-sun-x": Math.cos(a),
      "--earth-sun-y": Math.sin(a),
      "--earth-symbol-right": symbol.right,
      "--earth-symbol-bottom": symbol.bottom,
      "--earth-symbol-height": symbol.height,
      "--earth-symbol-tilt": symbol.tilt,
    };
    const body = Object.entries(vars).map(([name, value]) => `${name}:${round(value)}`).join(";");
    const rule = `${selector}{${body}}`;
    return minWidth === 0 ? rule : `@media (min-width:${minWidth}px){${rule}}`;
  }).join("");
}
