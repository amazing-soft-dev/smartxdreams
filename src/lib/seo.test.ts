import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { company } from "@/content/site";
import { team } from "@/content/team";
import { absoluteUrl, organizationJsonLd, organizationLogoPath, pageMetadata, socialImage, teamJsonLd } from "./seo";

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

  it("uses the built mark, not a raw master or the old mark", () => {
    expect(organizationLogoPath).not.toContain("logo-mark");
    expect(organizationLogoPath.startsWith("/brand/logo/")).toBe(true);
  });

  it("shows a dark mark that reads on white, with clear space on every side", async () => {
    const { data, info } = await sharp(logoFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let left = info.width;
    let right = 0;
    let lum = 0;
    let solid = 0;
    for (let p = 0; p < info.width * info.height; p++) {
      if (data[p * 4 + 3]! < 128) continue;
      const x = p % info.width;
      left = Math.min(left, x);
      right = Math.max(right, x);
      lum += (data[p * 4]! + data[p * 4 + 1]! + data[p * 4 + 2]!) / 3;
      solid++;
    }
    expect(lum / solid).toBeLessThan(90);
    expect(left).toBeGreaterThan(0);
    expect(right).toBeLessThan(info.width - 1);
  });
});

describe("pageMetadata", () => {
  const meta = pageMetadata({ title: "About", description: "Who we are.", path: "/about" });

  it("names the social image for Open Graph and Twitter, with its size and alt text", () => {
    expect(meta.openGraph?.images).toEqual([socialImage]);
    expect(meta.twitter?.images).toEqual([socialImage]);
    expect(socialImage).toMatchObject({ url: "/opengraph-image", type: "image/png", width: 1200, height: 630 });
    expect(socialImage.alt).toContain(company.name);
  });
});

describe("teamJsonLd", () => {
  it("describes each person on the team as a Person who works for the Organization", () => {
    const people = teamJsonLd();
    expect(people.map((p) => p.name)).toEqual(team.map((p) => p.name));
    for (const [i, p] of people.entries()) {
      expect(p["@type"]).toBe("Person");
      expect(p.jobTitle).toBe(team[i]!.role);
      expect(String(p.image)).toMatch(/^https?:\/\/.+\/team\//);
      expect(p.worksFor).toEqual({ "@id": expect.stringMatching(/#organization$/) });
    }
  });
});
