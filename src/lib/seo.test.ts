import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { absoluteUrl, organizationJsonLd, organizationLogoPath } from "./seo";

const publicDir = path.resolve(import.meta.dirname, "..", "..", "public");
const logoFile = path.join(publicDir, organizationLogoPath);

describe("organizationJsonLd", () => {
  it("names the logo with an absolute URL to organizationLogoPath", () => {
    expect(organizationJsonLd().logo).toBe(absoluteUrl(organizationLogoPath));
    expect(String(organizationJsonLd().logo)).toMatch(/^https?:\/\//);
  });

  it("points at a file in public/", () => {
    expect(existsSync(logoFile), `${organizationLogoPath} not found in public/`).toBe(true);
  });

  it("uses a square PNG of at least 112 px, as search engines ask", () => {
    const png = readFileSync(logoFile);
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    expect(width).toBe(height);
    expect(width).toBeGreaterThanOrEqual(112);
  });

  it("uses the new symbol, not the old mark", () => {
    expect(organizationLogoPath).not.toContain("logo-mark");
  });
});
