import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";

const root = path.resolve(import.meta.dirname, "..", "..");

/** Where a manifest icon URL is served from: app icon files from src/app, everything else from public/. */
function sourceOf(src: string): string {
  const appIcon = path.join(root, "src", "app", src);
  return existsSync(appIcon) ? appIcon : path.join(root, "public", src);
}

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file: string): string {
  const png = readFileSync(file);
  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
}

describe("web app manifest", () => {
  const icons = manifest().icons ?? [];

  it("lists a 192, a 512, a maskable 512 and a scalable icon", () => {
    expect(icons.map((i) => i.sizes)).toEqual(["192x192", "512x512", "512x512", "any"]);
  });

  it.each(icons.map((icon) => [icon.src, icon] as const))("%s exists", (src) => {
    expect(existsSync(sourceOf(src)), `${src} not found in src/app or public/`).toBe(true);
  });

  it.each(icons.filter((i) => i.type === "image/png").map((icon) => [icon.src, icon] as const))(
    "%s is as large as it says",
    (src, icon) => {
      expect(pngSize(sourceOf(src))).toBe(icon.sizes);
    },
  );

  it("has exactly one maskable icon, opaque so the launcher's crop never shows through", async () => {
    const maskable = icons.filter((i) => i.purpose === "maskable");
    expect(maskable).toHaveLength(1);
    const { channels, hasAlpha } = await sharp(sourceOf(maskable[0]!.src)).metadata();
    expect(hasAlpha).toBe(false);
    expect(channels).toBe(3);
  });

  it("keeps the maskable icon's mark inside the central 80% safe circle", async () => {
    const src = sourceOf(icons.find((i) => i.purpose === "maskable")!.src);
    const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
    const [r, g, b] = [data[0]!, data[1]!, data[2]!];
    const centre = info.width / 2;
    const radius = (info.width * 0.8) / 2;
    for (let y = 0; y < info.height; y += 2) {
      for (let x = 0; x < info.width; x += 2) {
        const p = (y * info.width + x) * info.channels;
        const background = Math.abs(data[p]! - r) + Math.abs(data[p + 1]! - g) + Math.abs(data[p + 2]! - b) < 12;
        if (!background) expect(Math.hypot(x - centre, y - centre), `mark pixel at ${x},${y}`).toBeLessThan(radius);
      }
    }
  });

  it("uses the new symbol icon set, not the old app icons", () => {
    for (const icon of icons) expect(icon.src).not.toMatch(/\/brand\/icon-\d+\.png$/);
  });
});
