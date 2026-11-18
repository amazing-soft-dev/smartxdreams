import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import brandMarks from "@/lib/brand-marks.json";
import { markSrcSet } from "./Logo";

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

});
