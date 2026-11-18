import { describe, expect, it } from "vitest";
import { horizonDistance, horizonV, LANDMARKS, PLATE_ASPECT } from "./plate";
import {
  heroToPlate,
  PLATE_BREAKPOINTS,
  type PlateBreakpoint,
  plateBreakpointFor,
  plateLayoutCss,
  plateMediaQuery,
  plateRect,
  plateToHero,
  plateUniform,
} from "./plate-layout";

/**
 * Hero shapes (width / height) each breakpoint must handle. Phones are tall; tablets run from portrait to
 * landscape; a phone on its side is short and wide; desktop heroes fill the window, from 5:4 (1.2) up to
 * just under the wide breakpoint; wide and ultrawide heroes go from short laptops and 21:9 to 32:9. The hero
 * is the viewport plus the 28 or 36 px the cards band covers, so its aspect is a little under the viewport's.
 */
const ASPECTS: Record<string, number[]> = {
  phone: [0.3, 0.36, 0.4, 0.46, 0.55, 0.62],
  tablet: [0.6, 0.69, 1, 1.4, 1.55],
  "landscape phone": [1.45, 1.62, 1.8, 2.04, 2.3],
  desktop: [1.2, 1.33, 1.5, 1.55, 1.6, 1.78, 1.94, 2, 2.1],
  wide: [2, 2.2, 2.33, 2.6, 2.8],
  ultrawide: [2.75, 3, 3.47, 4],
};

/** Breakpoints whose copy is a left column (the rest put it across the top). */
const COLUMN_COPY = new Set(["landscape phone", "desktop", "wide", "ultrawide"]);

/**
 * Real windows (CSS px), from phones to a 32:9 monitor. Each must pick a breakpoint whose placement works
 * for the hero it gives (the viewport plus the band's 28 px under 768 px wide, 36 px from there).
 */
const RESOLUTIONS: [number, number][] = [
  [360, 780],
  [390, 844],
  [430, 932],
  [667, 375],
  [844, 390],
  [915, 412],
  [768, 1024],
  [820, 1180],
  [1024, 1366],
  [1024, 768],
  [1180, 820],
  [1280, 600],
  [1280, 800],
  [1280, 1024],
  [1366, 768],
  [1440, 900],
  [1536, 864],
  [1920, 1080],
  [1920, 1200],
  [2560, 1080],
  [2560, 1440],
  [3440, 1440],
  [3840, 2160],
  [5120, 1440],
];

const EPS = 1e-9;
/** How far below the visible hero (H) the plate must reach: the cards band rises 28 or 36 px over it. */
const UNDER_BAND = 0.03;

const byName = (name: string): PlateBreakpoint => PLATE_BREAKPOINTS.find((bp) => bp.name === name)!;

/** The emblem's box in the hero (H) for a placed plate. */
function emblemBox(bp: PlateBreakpoint, aspect: number) {
  const rect = plateRect(bp.symbol, aspect);
  const { u, v, width, height } = LANDMARKS.symbol;
  const centre = plateToHero(rect, u, v);
  const w = width * rect.width;
  const h = height * rect.height;
  return { rect, left: centre.x - w / 2, right: centre.x + w / 2, top: centre.y + h / 2, bottom: centre.y - h / 2, h };
}

/** The checks every placement must pass, as failure messages (empty when it passes). */
function placementProblems(bp: PlateBreakpoint, aspect: number): string[] {
  const problems: string[] = [];
  const box = emblemBox(bp, aspect);
  const { rect } = box;
  if (rect.left + rect.width < aspect - EPS) problems.push("right edge uncovered");
  if (rect.bottom > EPS) problems.push("bottom edge uncovered");
  // The plate runs on under the cards band (28 or 36 px, at least 0.03 H on any hero), so its rounded corners
  // show the planet.
  if (rect.bottom > -UNDER_BAND) problems.push("plate stops at the band");
  if (!(rect.left <= EPS || plateToHero(rect, 0, horizonV(0)).y <= EPS)) problems.push("planet cut off on the left");
  if (box.left <= 0 || box.right >= aspect || box.bottom <= 0 || box.top >= 1) problems.push("emblem off screen");
  // On the planet: the emblem's top corners are below the limb.
  for (const x of [box.left, box.right]) {
    const { u, v } = heroToPlate(rect, x, box.top);
    if (u >= 0 && u <= 1 && horizonDistance(u, v) <= 0) problems.push("emblem corner in the sky");
  }
  if (COLUMN_COPY.has(bp.name)) {
    // Out of the copy column, the left 45% (on the widest heroes the column is capped well before that).
    if (box.left <= Math.min(aspect * 0.45, 1.4)) problems.push("emblem in the copy column");
    const eye = plateToHero(rect, LANDMARKS.cyclone.u, LANDMARKS.cyclone.v);
    if (eye.x >= aspect || eye.y >= 1) problems.push("cyclone eye off screen");
  } else if (box.top >= 0.55) {
    // Below the copy, which runs across the top 45%.
    problems.push("emblem under the copy");
  }
  return problems;
}

describe("plateRect", () => {
  it("places every breakpoint well over the hero shapes it must handle", () => {
    for (const bp of PLATE_BREAKPOINTS) {
      for (const aspect of ASPECTS[bp.name]!) {
        expect(placementProblems(bp, aspect), `${bp.name} @ ${aspect}`).toEqual([]);
      }
    }
  });

  it("passes the limb under the copy column, not through it, on wide desktop heroes", () => {
    // The copy column is the left 40% (44vw, capped at 620 px); its last line sits about 0.25 H up.
    for (const [name, aspects] of [
      ["desktop", [1.94, 2, 2.1]],
      ["wide", [2.2, 2.33]],
    ] as const) {
      for (const aspect of aspects) {
        const rect = plateRect(byName(name).symbol, aspect);
        const u = (aspect * 0.4 - rect.left) / rect.width;
        const limb = u < 0 ? -Infinity : plateToHero(rect, u, horizonV(u)).y;
        expect(limb, `${name} @ ${aspect}`).toBeLessThan(0.26);
      }
    }
  });

  it("puts the emblem's centre on its target", () => {
    const target = { right: 0.5, bottom: 0.45, height: 0.4 };
    const rect = plateRect(target, 2);
    const centre = plateToHero(rect, LANDMARKS.symbol.u, LANDMARKS.symbol.v);
    expect(centre.x).toBeCloseTo(1.5, 9);
    expect(centre.y).toBeCloseTo(0.45, 9);
  });

  it("draws the emblem at its target height unless covering the hero needs more", () => {
    const target = { right: 0.35, bottom: 0.48, height: 0.4 };
    const rect = plateRect(target, 1.6);
    expect(LANDMARKS.symbol.height * rect.height).toBeCloseTo(0.4, 9);
    // A very wide hero grows the plate, and the emblem with it.
    expect(LANDMARKS.symbol.height * plateRect(target, 3).height).toBeGreaterThan(0.4);
  });

  it("keeps the plate's own shape", () => {
    const rect = plateRect({ right: 0.3, bottom: 0.25, height: 0.22 }, 0.8);
    expect(rect.width / rect.height).toBeCloseTo(PLATE_ASPECT, 9);
    expect(PLATE_ASPECT).toBeCloseTo(1659 / 948, 9);
  });

  it("gives wider heroes a larger emblem", () => {
    const heights = ["desktop", "wide", "ultrawide"].map((name) => byName(name).symbol.height);
    expect(heights[1]).toBeGreaterThan(heights[0]!);
    expect(heights[2]).toBeGreaterThan(heights[1]!);
  });
});

describe("resolution matrix", () => {
  it("works for every common window, from phones to 32:9", () => {
    for (const [width, height] of RESOLUTIONS) {
      const bp = plateBreakpointFor(width, height);
      const aspect = width / (height + (width < 768 ? 28 : 36));
      expect(placementProblems(bp, aspect), `${width} x ${height} (${bp.name}, ${aspect.toFixed(2)})`).toEqual([]);
    }
  });

  it("picks the breakpoint each kind of window is meant to get", () => {
    expect(plateBreakpointFor(390, 844).name).toBe("phone");
    expect(plateBreakpointFor(820, 1180).name).toBe("tablet");
    expect(plateBreakpointFor(915, 412).name).toBe("landscape phone");
    expect(plateBreakpointFor(1024, 768).name).toBe("desktop");
    expect(plateBreakpointFor(1920, 1080).name).toBe("desktop");
    expect(plateBreakpointFor(1280, 600).name).toBe("desktop");
    expect(plateBreakpointFor(2560, 1080).name).toBe("wide");
    expect(plateBreakpointFor(3440, 1440).name).toBe("wide");
    expect(plateBreakpointFor(5120, 1440).name).toBe("ultrawide");
  });
});

describe("cloud emblem and cyclone", () => {
  it("keep the cyclone's eye on screen on desktop", () => {
    for (const aspect of ASPECTS.desktop!) {
      const rect = plateRect(byName("desktop").symbol, aspect);
      const eye = plateToHero(rect, LANDMARKS.cyclone.u, LANDMARKS.cyclone.v);
      expect(eye.x).toBeLessThan(aspect);
      expect(eye.y).toBeLessThan(1);
    }
  });
});

describe("coordinates", () => {
  it("map hero points to the plate and back", () => {
    const rect = plateRect(byName("desktop").symbol, 2);
    const { u, v } = heroToPlate(rect, 1.2, 0.3);
    const back = plateToHero(rect, u, v);
    expect(back.x).toBeCloseTo(1.2, 9);
    expect(back.y).toBeCloseTo(0.3, 9);
  });

  it("put the hero's top-left corner in the sky on desktop", () => {
    const rect = plateRect(byName("desktop").symbol, 2);
    const { u, v } = heroToPlate(rect, 0, 1);
    expect(v < 0 || horizonDistance(u, v) < 0).toBe(true);
  });

  it("give the shader the rectangle as left, bottom, width, height", () => {
    expect(plateUniform({ left: -0.1, bottom: -0.03, width: 2.2, height: 1.1 })).toEqual([-0.1, -0.03, 2.2, 1.1]);
  });
});

describe("plateBreakpointFor", () => {
  it("picks the last breakpoint that matches, skipping the aspect ones without a height", () => {
    expect(plateBreakpointFor(390).name).toBe("phone");
    expect(plateBreakpointFor(640).name).toBe("tablet");
    expect(plateBreakpointFor(1023).name).toBe("tablet");
    // Every breakpoint from desktop up needs a landscape window, so width alone stops at the tablet.
    expect(plateBreakpointFor(5120).name).toBe("tablet");
  });

  it("uses the aspect when it has a height", () => {
    expect(plateBreakpointFor(1023, 1023 / 1.6).name).toBe("landscape phone");
    expect(plateBreakpointFor(1023, 1023 / 1.59).name).toBe("tablet");
    expect(plateBreakpointFor(2200, 1000).name).toBe("wide");
    expect(plateBreakpointFor(2900, 1000).name).toBe("ultrawide");
    // A large tablet held upright keeps the tablet layout; a phone on its side narrower than 640 px stays a phone.
    expect(plateBreakpointFor(1024, 1366).name).toBe("tablet");
    expect(plateBreakpointFor(1366, 1024).name).toBe("desktop");
    expect(plateBreakpointFor(600, 300).name).toBe("phone");
  });
});

describe("plateLayoutCss", () => {
  const css = plateLayoutCss(".x");

  it("writes the constants and the plate rectangle once", () => {
    for (const name of ["su", "sv", "sh", "aspect", "height", "left", "bottom"]) {
      expect(css.match(new RegExp(`--plate-${name}:`, "g")), name).toHaveLength(1);
    }
  });

  it("writes each breakpoint's emblem target in cascade order, the first without a media query", () => {
    expect(css.match(/@media/g)).toHaveLength(PLATE_BREAKPOINTS.length - 1);
    let from = 0;
    for (const bp of PLATE_BREAKPOINTS) {
      const { symbol } = bp;
      const rule = `.x{--plate-symbol-right:${symbol.right};--plate-symbol-bottom:${symbol.bottom};--plate-symbol-height:${symbol.height}}`;
      const query = plateMediaQuery(bp);
      const block = query ? `@media ${query}{${rule}}` : rule;
      const at = css.indexOf(block, from);
      expect(at, bp.name).toBeGreaterThanOrEqual(from);
      from = at + block.length;
    }
  });

  it("writes the aspect as an integer ratio", () => {
    expect(plateMediaQuery({ name: "t", minWidth: 1024, minAspect: 2.2, symbol: byName("desktop").symbol })).toBe(
      "(min-width:1024px) and (min-aspect-ratio:2200/1000)",
    );
    expect(plateMediaQuery(byName("phone"))).toBe("");
  });

  it("compares the same lengths as plateRect(), the two left-edge options with min()", () => {
    const height = /--plate-height:max\((.*?)\);--plate-left/.exec(css)?.[1] ?? "";
    expect(height.split("calc(")).toHaveLength(6);
    expect(height.match(/min\(/g)).toHaveLength(1);
    expect(css).toContain(`--plate-limb-left:${Number(horizonV(0).toFixed(5))}`);
  });
});
