import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import brandMarks from "@/lib/brand-marks.json";
import { markSrc, markSrcSet, markWidth } from "./Logo";

const publicDir = path.resolve(import.meta.dirname, "..", "..", "..", "public");
const tones = ["dark", "light"] as const;

describe("logo files", () => {
  it.each(tones)("tone %s lists a file for every built width, and each one exists", (tone) => {
    const listed = markSrcSet(tone)
      .split(", ")
      .map((entry) => entry.split(" ")[0]!);
    expect(listed).toHaveLength(brandMarks.widths.length);
    for (const src of listed) expect(existsSync(path.join(publicDir, src)), `${src} is missing`).toBe(true);
  });

  it.each(tones.flatMap((tone) => brandMarks.widths.map((width) => [tone, width] as const)))(
    "tone %s at %i px keeps the trimmed master's aspect ratio",
    async (tone, width) => {
      const { width: w, height: h } = await sharp(path.join(publicDir, markSrc(tone, width))).metadata();
      expect(w).toBe(width);
      // Drawn at the file's own width, the component's height must match the file's to the pixel.
      expect(Math.abs(markWidth(tone, h!) - w!)).toBeLessThanOrEqual(1);
    },
  );
});
