import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cp, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..", "..", "..");
/** Everything scripts/build-brand.mjs writes. */
const BUILT = [
  "public/brand/logo",
  "public/brand/icons",
  "public/products/logos",
  "src/app/favicon.ico",
  "src/app/apple-icon.png",
  "src/app/icon.svg",
  "src/lib/brand-marks.json",
];
const MISSING = "public/brand/logo/smartxdreams-mark-on-dark-64.webp";
const RESIZED = "public/products/logos/acorn-96.webp";
const OVERSIZED = "public/brand/logo/smartxdreams-mark-on-light-512.png";

/**
 * `npm run check:brand` is the only thing between a stale or bloated logo and the site, and it no longer
 * re-encodes the files it checks. This runs it against a copy of the built files with three of them spoiled,
 * and expects it to name those three and no others.
 */
describe("check:brand", () => {
  let copy = "";
  let exitCode: number | string | null | undefined = 0;
  let problems: string[] = [];

  beforeAll(async () => {
    copy = await mkdtemp(path.join(os.tmpdir(), "brand-check-"));
    for (const entry of BUILT) await cp(path.join(root, entry), path.join(copy, entry), { recursive: true });

    await rm(path.join(copy, MISSING));
    // One pixel narrower than the masters give.
    await sharp(path.join(root, RESIZED)).resize({ width: 95 }).toFile(path.join(copy, RESIZED));
    // The right size and format, but noise, which no encoder makes small: far over the 80 KB budget.
    const { width = 0, height = 0 } = await sharp(path.join(root, OVERSIZED)).metadata();
    await sharp(randomBytes(width * height * 4), { raw: { width, height, channels: 4 } })
      .png()
      .toFile(path.join(copy, OVERSIZED));

    const stderr = await new Promise<string>((resolve) => {
      execFile(process.execPath, ["scripts/build-brand.mjs", `--check=${copy}`], { cwd: root }, (error, _stdout, output) => {
        exitCode = error?.code ?? 0;
        resolve(output);
      });
    });
    problems = stderr.split(/\r?\n/).filter((line) => /^(public|src)\//.test(line));
  }, 120_000);

  afterAll(async () => {
    if (copy) await rm(copy, { recursive: true, force: true });
  });

  it("fails", () => {
    expect(exitCode).toBe(1);
  });

  it("names a file that is missing", () => {
    expect(problems).toContain(`${MISSING}  missing or out of date: run npm run brand`);
  });

  it("names a file whose size differs from what the masters give", () => {
    expect(problems).toContain(`${RESIZED}  missing or out of date: run npm run brand`);
  });

  it("names a file over its byte budget", () => {
    expect(problems.filter((line) => line.startsWith(`${OVERSIZED}  `))).toEqual([
      expect.stringMatching(/ {2}\d+ KB, over its budget of 80 KB$/),
    ]);
  });

  it("accepts every other file", () => {
    expect(problems).toHaveLength(3);
  });
});
