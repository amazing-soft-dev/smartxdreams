import { describe, expect, it } from "vitest";
import { maskGlow } from "./glow-mask";
import { GLOW_BAND, glowCoverage, glowFade, horizonV, PLATE_ASPECT } from "./plate";

/** A one-column RGBA image `height` px tall, every pixel the same colour, opaque. */
function column(height: number, [r, g, b]: [number, number, number]): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(height * 4);
  for (let y = 0; y < height; y++) pixels.set([r, g, b, 255], y * 4);
  return pixels;
}

describe("maskGlow", () => {
  const height = 400;
  // The single column sits at u = 0.5; rows are v = (y + 0.5) / height.
  const limbRow = Math.floor(horizonV(0.5) * height);

  it("keeps the planet opaque, so the planet canvas's anti-aliased edge has the plate under it", () => {
    const pixels = column(height, [10, 60, 160]);
    maskGlow(pixels, 1, height);
    for (let y = limbRow + 1; y < height; y++) expect(pixels[y * 4 + 3], `row ${y}`).toBe(255);
  });

  it("drops the sky beyond the band entirely", () => {
    const pixels = column(height, [255, 255, 255]);
    maskGlow(pixels, 1, height);
    // Rows well over the band: the limb is not steep at u = 0.5, so a row distance is close to a limb distance.
    const beyond = Math.floor((horizonV(0.5) - GLOW_BAND * 1.2) * height);
    for (let y = 0; y <= beyond; y++) expect(pixels[y * 4 + 3], `row ${y}`).toBe(0);
  });

  it("gives the painted navy sky no glow, wherever it is in the band", () => {
    // The emblem art's sky in the haze just over the rim: red near 0, green under the floor, blue high.
    const pixels = column(height, [5, 22, 190]);
    maskGlow(pixels, 1, height);
    for (let y = 0; y <= limbRow - 1; y++) expect(pixels[y * 4 + 3], `row ${y}`).toBe(0);
  });

  it("keeps the bright rim whole at the limb and fades it out across the band", () => {
    const pixels = column(height, [140, 220, 255]);
    maskGlow(pixels, 1, height);
    const alpha = (y: number) => pixels[y * 4 + 3]!;
    expect(alpha(limbRow - 1)).toBeGreaterThan(240);
    // Monotonic: never brighter further out.
    for (let y = 1; y < limbRow; y++) expect(alpha(y)).toBeGreaterThanOrEqual(alpha(y - 1));
    expect(alpha(Math.floor((horizonV(0.5) - GLOW_BAND / 2) * height))).toBeLessThan(200);
  });

  it("leaves the colour as painted", () => {
    const pixels = column(height, [140, 220, 255]);
    maskGlow(pixels, 1, height);
    expect([...pixels.slice(0, 3)]).toEqual([140, 220, 255]);
  });

  it("is the shader's coverage times its fade", () => {
    const pixels = column(height, [90, 120, 200]);
    maskGlow(pixels, 1, height);
    const y = limbRow - 12;
    const v = (y + 0.5) / height;
    // Nearly flat at u = 0.5: the distance across the curve is close to the vertical one.
    const expected = glowCoverage(90 / 255, 120 / 255) * glowFade(v - horizonV(0.5));
    expect(pixels[y * 4 + 3]! / 255).toBeCloseTo(expected, 1);
    expect(PLATE_ASPECT).toBeGreaterThan(1);
  });
});
