import { describe, expect, it } from "vitest";
import { SYMBOL } from "@/lib/brand-symbol";
import { EARTH_BREAKPOINTS, earthLayoutCss, earthLayoutFor, limbHeightAt, planetCircle, symbolUniform } from "./layout";
import { CLOUD_SOFTNESS, CLOUD_STROKE_SCALE, SYMBOL_MASK_SIZE, symbolMaskTransform } from "./symbol-mask";

/** Half the artwork's width and height, in H, for a placement height (ignoring the small tilt). */
const halfSize = (height: number) => ({ w: (height * SYMBOL.ratio) / 2, h: height / 2 });

describe("brand symbol geometry", () => {
  it("keeps the numeric box in step with the viewBox string", () => {
    const { x, y, width, height } = SYMBOL.box;
    expect(SYMBOL.viewBox).toBe(`${x} ${y} ${width} ${height}`);
    expect(SYMBOL.ratio).toBeCloseTo(width / height, 9);
  });
});

describe("cloud symbol placement", () => {
  it("sits on the planet, under the limb, at every breakpoint", () => {
    for (const { planet, symbol } of EARTH_BREAKPOINTS) {
      const circle = planetCircle(planet);
      const { w, h } = halfSize(symbol.height);
      // Both top corners of the artwork are below the limb.
      for (const fromRight of [symbol.right - w, symbol.right + w]) {
        const limb = limbHeightAt(circle, Math.max(fromRight, 0));
        expect(limb).not.toBeNull();
        expect(symbol.bottom + h).toBeLessThan(limb!);
      }
      expect(symbol.bottom - h).toBeGreaterThan(0);
    }
  });

  it("stays inside the hero's right edge", () => {
    for (const { symbol } of EARTH_BREAKPOINTS) expect(symbol.right - halfSize(symbol.height).w).toBeGreaterThan(0);
  });

  it("clears the headline and the cards on desktop", () => {
    // Measured desktop hero, 1460 x 1088: the headline ends 282 px from the right edge (0.26 H) and the cards
    // start 643 px from the top (0.41 H above the bottom).
    const { symbol } = earthLayoutFor(1475);
    const { w, h } = halfSize(symbol.height);
    expect(symbol.right + w).toBeLessThan(0.26);
    expect(symbol.bottom - h).toBeGreaterThan(0.41);
  });

  it("is a uniform measured from the bottom-left with the tilt in radians", () => {
    const [x, y, side, tilt] = symbolUniform({ right: 0.1, bottom: 0.5, height: 0.2, tilt: -90 }, 1.5, 0.5);
    expect(x).toBeCloseTo(1.4, 9);
    expect(y).toBe(0.5);
    expect(side).toBeCloseTo(0.4, 9);
    expect(tilt).toBeCloseTo(-Math.PI / 2, 9);
  });

  it("is written into the fallback CSS", () => {
    const css = earthLayoutCss(".x");
    for (const name of ["right", "bottom", "height", "tilt"]) expect(css).toContain(`--earth-symbol-${name}:`);
  });
});

describe("symbolMaskTransform", () => {
  it("centres the artwork with room for the widened, blurred strands", () => {
    const t = symbolMaskTransform(SYMBOL_MASK_SIZE);
    const { x, y, width, height } = SYMBOL.box;
    const spill = ((SYMBOL.stroke * CLOUD_STROKE_SCALE) / 2 + CLOUD_SOFTNESS * 2) * t.scale;
    const left = x * t.scale + t.offsetX;
    const top = y * t.scale + t.offsetY;
    const right = left + width * t.scale;
    const bottom = top + height * t.scale;
    expect(top).toBeCloseTo(spill, 6);
    expect(SYMBOL_MASK_SIZE - bottom).toBeCloseTo(spill, 6);
    expect(left).toBeCloseTo(SYMBOL_MASK_SIZE - right, 6);
    expect(left).toBeGreaterThan(spill);
  });

  it("reports the share of the mask the artwork's height covers", () => {
    const t = symbolMaskTransform(512);
    expect(t.coverage).toBeCloseTo((SYMBOL.box.height * t.scale) / 512, 9);
    expect(t.coverage).toBeGreaterThan(0.5);
    expect(t.coverage).toBeLessThan(1);
  });
});
