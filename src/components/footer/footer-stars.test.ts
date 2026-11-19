import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildStarShadows, FOOTER_STAR_COLORS, STAR_ALPHA, STAR_LAYERS, STAR_TILE } from "./footer-stars";

/** One shadow: x, y, a blur unless it is zero, a spread on halos only, then the colour as #rrggbbaa. */
const SHADOW = /^(\d+)px (\d+)px (?:([\d.]+)px (?:(\d+)px )?)?#([0-9a-f]{6})([0-9a-f]{2})$/;

const parse = (value: string) =>
  value.split(",").map((shadow) => {
    const match = SHADOW.exec(shadow);
    if (!match) throw new Error(`Unexpected shadow: ${shadow}`);
    return {
      x: Number(match[1]),
      y: Number(match[2]),
      blur: match[3],
      spread: match[4],
      rgb: match[5]!,
      alpha: parseInt(match[6]!, 16) / 255,
    };
  });

describe("buildStarShadows", () => {
  it("gives the same sky for the same seed, so server and client markup match", () => {
    for (const layer of STAR_LAYERS) expect(buildStarShadows(layer)).toBe(buildStarShadows(layer));
  });

  it("gives a different sky for a different seed", () => {
    expect(buildStarShadows({ size: 1, count: 20, seed: 1 })).not.toBe(buildStarShadows({ size: 1, count: 20, seed: 2 }));
  });

  it("puts one star per count inside the tile, plus a few halos", () => {
    for (const layer of STAR_LAYERS) {
      const shadows = parse(buildStarShadows(layer));
      const stars = shadows.filter((s) => s.spread === undefined);
      const halos = shadows.filter((s) => s.spread !== undefined);
      expect(stars).toHaveLength(layer.count);
      expect(halos.length).toBeLessThan(layer.count * 0.06);
      for (const star of stars) {
        expect(star.x).toBeGreaterThanOrEqual(0);
        expect(star.x).toBeLessThan(STAR_TILE.width);
        expect(star.y).toBeGreaterThanOrEqual(0);
        expect(star.y).toBeLessThan(STAR_TILE.height);
        expect(star.alpha).toBeGreaterThanOrEqual(STAR_ALPHA.min);
        expect(star.alpha).toBeLessThanOrEqual(STAR_ALPHA.max);
      }
    }
  });

  it("writes each shadow the shortest way: no zero blur, no leading zero, hex colours from the palette", () => {
    const palette = new Set(FOOTER_STAR_COLORS.map((rgb) => rgb.map((v) => v.toString(16).padStart(2, "0")).join("")));
    for (const layer of STAR_LAYERS) {
      // parse() already rejects anything but the short form, a space after a comma or an rgb() colour included.
      for (const shadow of parse(buildStarShadows(layer))) {
        expect(palette.has(shadow.rgb), shadow.rgb).toBe(true);
        if (shadow.spread === undefined) {
          // A star: the 1 px layer has no blur at all, the 2 and 3 px layers .4px and .6px.
          expect(shadow.blur).toBe(layer.size === 1 ? undefined : `.${layer.size * 2}`);
        } else {
          // A halo: a blur of three sizes and a spread of one.
          expect([shadow.blur, shadow.spread]).toEqual([String(layer.size * 3), String(layer.size)]);
        }
      }
    }
  });

  it("is the sky it was before the values were shortened", () => {
    // Formerly `2390px 61px 0px rgb(181 207 255 / 0.68)` and `1358px 1198px 0.4px rgb(255 255 255 / 0.82)`:
    // 0.68 and 0.82 are 173 and 209 of 255, ad and d1 in hex.
    expect(buildStarShadows(STAR_LAYERS[0]!).split(",")[0]).toBe("2390px 61px #b5cfffad");
    expect(buildStarShadows(STAR_LAYERS[1]!).split(",")[0]).toBe("1358px 1198px .4px #ffffffd1");
  });

  it("keeps the three lists, which are in every page's markup, under 17 KB", () => {
    const bytes = STAR_LAYERS.reduce((sum, layer) => sum + buildStarShadows(layer).length, 0);
    expect(bytes).toBeLessThan(17_000);
  });

  it("drifts far stars fastest, near stars slowest, as in StarfieldFX", () => {
    const durations = STAR_LAYERS.map((l) => l.duration);
    expect(durations).toEqual([...durations].sort((a, b) => a - b));
    expect(STAR_LAYERS.map((l) => l.size)).toEqual([1, 2, 3]);
  });

  it("shifts near stars most with the cursor, for depth", () => {
    const shifts = STAR_LAYERS.map((l) => l.parallax);
    expect(shifts).toEqual([...shifts].sort((a, b) => a - b));
    expect(new Set(shifts).size).toBe(shifts.length);
  });
});

describe("FooterStars", () => {
  it("is a client component, so the lists are in each document once and not again in the React payload", () => {
    // A server component's output is also serialised into the payload: that doubled the lists in every page.
    expect(readFileSync("src/components/footer/FooterStars.tsx", "utf8")).toMatch(/^"use client";/);
  });
});
