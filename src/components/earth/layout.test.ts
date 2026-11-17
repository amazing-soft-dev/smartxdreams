import { describe, expect, it } from "vitest";
import {
  EARTH_BREAKPOINTS,
  earthLayoutCss,
  earthLayoutFor,
  limbHeightAt,
  planetCircle,
  planetUniform,
  SUN_FRONT,
  sunDirection,
} from "./layout";

describe("planetCircle", () => {
  it("passes through both limb points of the spec", () => {
    for (const { planet } of EARTH_BREAKPOINTS) {
      const circle = planetCircle(planet);
      // Distance from the centre at (-right, -bottom), with the right edge at x = 0 and the bottom at y = 0.
      const distance = (x: number, y: number) => Math.hypot(x + circle.right, y + circle.bottom);
      expect(distance(0, planet.edgeY)).toBeCloseTo(circle.radius, 9);
      expect(distance(-planet.baseX, 0)).toBeCloseTo(circle.radius, 9);
    }
  });

  it("puts the centre beyond the right edge by the overhang", () => {
    const circle = planetCircle({ edgeY: 1, baseX: 0.8, overhang: 0.1 });
    expect(circle.right).toBeCloseTo(-0.1, 9);
  });

  it("rejects specs that describe no planet", () => {
    expect(() => planetCircle({ edgeY: 0, baseX: 1, overhang: 0 })).toThrow(RangeError);
    expect(() => planetCircle({ edgeY: 1, baseX: -1, overhang: 0 })).toThrow(RangeError);
  });
});

describe("limbHeightAt", () => {
  it("is null where the planet does not reach", () => {
    const circle = planetCircle({ edgeY: 1, baseX: 0.8, overhang: 0.1 });
    expect(limbHeightAt(circle, 5)).toBeNull();
  });

  it("falls from the right edge toward the bottom", () => {
    for (const { planet } of EARTH_BREAKPOINTS) {
      const circle = planetCircle(planet);
      const near = limbHeightAt(circle, planet.baseX * 0.25)!;
      const far = limbHeightAt(circle, planet.baseX * 0.75)!;
      expect(near).toBeGreaterThan(far);
    }
  });
});

describe("EARTH_BREAKPOINTS", () => {
  it("are sorted and start at 0", () => {
    expect(EARTH_BREAKPOINTS[0]!.minWidth).toBe(0);
    for (let i = 1; i < EARTH_BREAKPOINTS.length; i++) {
      expect(EARTH_BREAKPOINTS[i]!.minWidth).toBeGreaterThan(EARTH_BREAKPOINTS[i - 1]!.minWidth);
    }
  });

  it("leave the left of the hero to the sky on desktop", () => {
    // At 1475 x 1088 (the measured desktop hero) the hero is 1.36 H wide: its left 30% is sky only.
    const circle = planetCircle(earthLayoutFor(1475).planet);
    expect(limbHeightAt(circle, 1.36 * 0.7) ?? 0).toBeLessThanOrEqual(0);
  });
});

describe("earthLayoutFor", () => {
  it("picks the widest breakpoint at or below the width", () => {
    expect(earthLayoutFor(390).minWidth).toBe(0);
    expect(earthLayoutFor(639).minWidth).toBe(0);
    expect(earthLayoutFor(640).minWidth).toBe(640);
    expect(earthLayoutFor(1023).minWidth).toBe(640);
    expect(earthLayoutFor(1024).minWidth).toBe(1024);
    expect(earthLayoutFor(2560).minWidth).toBe(1024);
  });
});

describe("planetUniform", () => {
  it("measures the centre from the bottom-left corner", () => {
    const [x, y, r] = planetUniform({ right: -0.1, bottom: 0.2, radius: 1.1 }, 1.5);
    expect(x).toBeCloseTo(1.6, 9);
    expect(y).toBeCloseTo(-0.2, 9);
    expect(r).toBe(1.1);
  });
});

describe("sunDirection", () => {
  it("is a unit vector in front of the planet, pointing at the limb angle", () => {
    for (const { sunAngle } of EARTH_BREAKPOINTS) {
      const [x, y, z] = sunDirection(sunAngle);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 9);
      expect(z).toBe(SUN_FRONT);
      expect((Math.atan2(y, x) * 180) / Math.PI).toBeCloseTo(sunAngle, 9);
    }
  });

  it("rises on the visible part of the limb on desktop", () => {
    // The flare must land inside a 1.36 H wide desktop hero, below its top edge.
    const { planet, sunAngle } = earthLayoutFor(1475);
    const c = planetCircle(planet);
    const a = (sunAngle * Math.PI) / 180;
    const fromRight = c.right - Math.cos(a) * c.radius; // centre is at x = -right from the right edge
    const height = Math.sin(a) * c.radius - c.bottom;
    expect(fromRight).toBeGreaterThan(0);
    expect(fromRight).toBeLessThan(1.36);
    expect(height).toBeGreaterThan(0);
    expect(height).toBeLessThan(1);
  });
});

describe("earthLayoutCss", () => {
  it("writes one rule per breakpoint, the first without a media query", () => {
    const css = earthLayoutCss(".x");
    expect(css.startsWith(".x{--earth-right:")).toBe(true);
    expect(css).toContain("--earth-sun-x:");
    expect(css.match(/@media/g)).toHaveLength(EARTH_BREAKPOINTS.length - 1);
    expect(css).toContain("@media (min-width:1024px){.x{");
  });
});
