import { describe, expect, it } from "vitest";
import { horizonDistance, LANDMARKS } from "./plate";
import {
  heroToPlate,
  PLATE_BREAKPOINTS,
  plateBreakpointFor,
  plateLayoutCss,
  plateRect,
  plateToHero,
  plateUniform,
} from "./plate-layout";

/**
 * Hero shapes (width / height) each breakpoint must handle: phones are tall, tablets run from portrait to
 * landscape, and the desktop hero is between a 1024 × 660 laptop and an ultrawide.
 */
const ASPECTS: Record<number, number[]> = {
  0: [0.4, 0.46, 0.55, 0.62],
  640: [0.6, 0.69, 1, 1.4],
  1024: [1.5, 1.55, 1.94, 2, 2.4],
};

const EPS = 1e-9;

/** The symbol's box in the hero (H) for a placed plate. */
function symbolBox(aspect: number, minWidth: number) {
  const { symbol: target } = plateBreakpointFor(minWidth);
  const rect = plateRect(target, aspect);
  const { u, v, width, height } = LANDMARKS.symbol;
  const centre = plateToHero(rect, u, v);
  const w = width * rect.width;
  const h = height * rect.height;
  return { rect, left: centre.x - w / 2, right: centre.x + w / 2, top: centre.y + h / 2, bottom: centre.y - h / 2 };
}

describe("plateRect", () => {
  it("covers the hero's left, right and bottom edges at every breakpoint and shape", () => {
    for (const { minWidth, symbol } of PLATE_BREAKPOINTS) {
      for (const aspect of ASPECTS[minWidth]!) {
        const rect = plateRect(symbol, aspect);
        expect(rect.left, `${minWidth} @ ${aspect}`).toBeLessThanOrEqual(EPS);
        expect(rect.left + rect.width, `${minWidth} @ ${aspect}`).toBeGreaterThanOrEqual(aspect - EPS);
        expect(rect.bottom, `${minWidth} @ ${aspect}`).toBeLessThanOrEqual(EPS);
      }
    }
  });

  it("puts the symbol's centre on its target", () => {
    const target = { right: 0.5, bottom: 0.45, height: 0.4 };
    const rect = plateRect(target, 2);
    const centre = plateToHero(rect, LANDMARKS.symbol.u, LANDMARKS.symbol.v);
    expect(centre.x).toBeCloseTo(1.5, 9);
    expect(centre.y).toBeCloseTo(0.45, 9);
  });

  it("draws the symbol at its target height unless covering the hero needs more", () => {
    const target = { right: 0.55, bottom: 0.48, height: 0.4 };
    const rect = plateRect(target, 2);
    expect(LANDMARKS.symbol.height * rect.height).toBeCloseTo(0.4, 9);
    // A very wide hero grows the plate, and the symbol with it.
    expect(LANDMARKS.symbol.height * plateRect(target, 3).height).toBeGreaterThan(0.4);
  });

  it("keeps the plate twice as wide as it is tall", () => {
    const rect = plateRect({ right: 0.3, bottom: 0.25, height: 0.22 }, 0.8);
    expect(rect.width / rect.height).toBeCloseTo(1774 / 887, 9);
  });
});

describe("cloud symbol and cyclone", () => {
  it("keep the symbol wholly on screen and on the planet", () => {
    for (const { minWidth } of PLATE_BREAKPOINTS) {
      for (const aspect of ASPECTS[minWidth]!) {
        const box = symbolBox(aspect, minWidth);
        expect(box.left, `${minWidth} @ ${aspect}`).toBeGreaterThan(0);
        expect(box.right, `${minWidth} @ ${aspect}`).toBeLessThan(aspect);
        expect(box.bottom, `${minWidth} @ ${aspect}`).toBeGreaterThan(0);
        expect(box.top, `${minWidth} @ ${aspect}`).toBeLessThan(1);
      }
    }
  });

  it("keep the symbol out of the desktop copy column (the left 45%)", () => {
    for (const aspect of ASPECTS[1024]!) expect(symbolBox(aspect, 1024).left).toBeGreaterThan(aspect * 0.45);
  });

  it("keep the symbol below the copy on phones and tablets (the top 45%)", () => {
    for (const minWidth of [0, 640]) {
      for (const aspect of ASPECTS[minWidth]!) expect(symbolBox(aspect, minWidth).top).toBeLessThan(0.55);
    }
  });

  it("keep the cyclone's eye on screen on desktop", () => {
    for (const aspect of ASPECTS[1024]!) {
      const rect = plateRect(plateBreakpointFor(1475).symbol, aspect);
      const eye = plateToHero(rect, LANDMARKS.cyclone.u, LANDMARKS.cyclone.v);
      expect(eye.x).toBeLessThan(aspect);
      expect(eye.y).toBeLessThan(1);
    }
  });
});

describe("coordinates", () => {
  it("map hero points to the plate and back", () => {
    const rect = plateRect(plateBreakpointFor(1475).symbol, 2);
    const { u, v } = heroToPlate(rect, 1.2, 0.3);
    const back = plateToHero(rect, u, v);
    expect(back.x).toBeCloseTo(1.2, 9);
    expect(back.y).toBeCloseTo(0.3, 9);
  });

  it("put the hero's top-left corner in the sky on desktop", () => {
    const rect = plateRect(plateBreakpointFor(1475).symbol, 2);
    const { u, v } = heroToPlate(rect, 0, 1);
    expect(v < 0 || horizonDistance(u, v) < 0).toBe(true);
  });

  it("give the shader the rectangle as left, bottom, width, height", () => {
    expect(plateUniform({ left: -0.1, bottom: -0.03, width: 2.2, height: 1.1 })).toEqual([-0.1, -0.03, 2.2, 1.1]);
  });
});

describe("plateBreakpointFor", () => {
  it("picks the widest breakpoint at or below the width", () => {
    expect(plateBreakpointFor(390).minWidth).toBe(0);
    expect(plateBreakpointFor(640).minWidth).toBe(640);
    expect(plateBreakpointFor(1023).minWidth).toBe(640);
    expect(plateBreakpointFor(1024).minWidth).toBe(1024);
  });
});

describe("plateLayoutCss", () => {
  const css = plateLayoutCss(".x");

  it("writes the constants and the plate rectangle once", () => {
    for (const name of ["su", "sv", "sh", "aspect", "height", "left", "bottom"]) {
      expect(css.match(new RegExp(`--plate-${name}:`, "g")), name).toHaveLength(1);
    }
  });

  it("writes each breakpoint's symbol target, the first without a media query", () => {
    expect(css.match(/@media/g)).toHaveLength(PLATE_BREAKPOINTS.length - 1);
    for (const { minWidth, symbol } of PLATE_BREAKPOINTS) {
      const rule = `.x{--plate-symbol-right:${symbol.right};--plate-symbol-bottom:${symbol.bottom};--plate-symbol-height:${symbol.height}}`;
      expect(css).toContain(minWidth === 0 ? rule : `@media (min-width:${minWidth}px){${rule}}`);
    }
  });

  it("compares the same four lengths as plateRect()", () => {
    const height = /--plate-height:max\((.*?)\);--plate-left/.exec(css)?.[1] ?? "";
    expect(height.split("calc(")).toHaveLength(5);
  });
});
