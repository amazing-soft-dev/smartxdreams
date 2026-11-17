import { expect, test } from "@playwright/test";

const hero = 'section[aria-labelledby="home-hero-title"]';

/**
 * The cloud symbol's box in the painted plate, as fractions of the plate (src/components/earth/plate.ts:
 * x 1065–1470 and y 310–635 px of 1774 × 887).
 */
const SYMBOL = { left: 1065 / 1774, right: 1470 / 1774, top: 310 / 887, bottom: 635 / 887 };

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test.describe("Home hero layout", () => {
  test("fills the viewport, with the cards band below the fold, at common window sizes", async ({ page }, testInfo) => {
    // Desktop windows from 4:3 to 16:9; the phone project keeps its own screen.
    const sizes =
      testInfo.project.name === "mobile"
        ? [null]
        : [
            { width: 1306, height: 768 },
            { width: 1440, height: 900 },
            { width: 1920, height: 1080 },
            { width: 1024, height: 768 },
          ];
    for (const size of sizes) {
      if (size) await page.setViewportSize(size);
      await page.goto("/");
      const viewport = page.viewportSize()!;
      const heroBox = (await page.locator(hero).boundingBox())!;
      const bandBox = (await page.locator(`${hero} + [data-nav-theme]`).boundingBox())!;
      const at = `${viewport.width} x ${viewport.height}`;
      expect(heroBox.height, at).toBeGreaterThanOrEqual(viewport.height);
      expect(bandBox.y, at).toBeGreaterThanOrEqual(viewport.height - 1);
    }
  });

  test("keeps the copy clear of the cloud symbol, and the symbol in the hero above the cards", async ({ page }) => {
    await page.goto("/");
    const plate = await page.locator(`${hero} canvas[data-earth-plate="planet"]`).boundingBox();
    expect(plate).not.toBeNull();
    const symbol: Box = {
      x: plate!.x + SYMBOL.left * plate!.width,
      y: plate!.y + SYMBOL.top * plate!.height,
      width: (SYMBOL.right - SYMBOL.left) * plate!.width,
      height: (SYMBOL.bottom - SYMBOL.top) * plate!.height,
    };

    const copy = [
      page.locator("#home-hero-title"),
      page.locator(`${hero} p`).first(),
      page.getByRole("link", { name: "Explore the products" }),
    ];
    for (const part of copy) {
      const box = await part.boundingBox();
      expect(box).not.toBeNull();
      expect(overlaps(box!, symbol), await part.evaluate((el) => el.textContent?.slice(0, 30) ?? "")).toBe(false);
    }

    const heroBox = (await page.locator(hero).boundingBox())!;
    const bandBox = (await page.locator(`${hero} + [data-nav-theme]`).boundingBox())!;
    expect(symbol.x).toBeGreaterThanOrEqual(heroBox.x);
    expect(symbol.x + symbol.width).toBeLessThanOrEqual(heroBox.x + heroBox.width);
    // Above the cards band, which rises over the hero's bottom edge.
    expect(symbol.y + symbol.height).toBeLessThanOrEqual(bandBox.y);
  });

  test("shows the hero, never the page background, at the band's rounded corners", async ({ page }) => {
    await page.goto("/");
    const band = page.locator(`${hero} + [data-nav-theme]`);
    const { radius, marginTop } = await band.evaluate((el) => {
      const style = getComputedStyle(el);
      return { radius: parseFloat(style.borderTopLeftRadius), marginTop: parseFloat(style.marginTop) };
    });
    expect(radius).toBeGreaterThan(0);
    // The band rises over the hero by exactly its corner radius...
    expect(marginTop).toBeCloseTo(-radius, 0);
    // ...so the hero reaches down past the band's top by at least that much, filling the corners.
    const heroBox = (await page.locator(hero).boundingBox())!;
    const bandBox = (await band.boundingBox())!;
    expect(heroBox.y + heroBox.height - bandBox.y).toBeGreaterThanOrEqual(radius - 0.5);
    // And the backdrop's plate runs on under the band, so the right corner shows the planet, not empty sky.
    const plate = (await page.locator(`${hero} canvas[data-earth-plate="planet"]`).boundingBox())!;
    expect(plate.y + plate.height).toBeGreaterThanOrEqual(bandBox.y + radius);
  });

  test("puts the product cards in a dark band directly under the hero", async ({ page }) => {
    await page.goto("/");
    const band = page.locator(`${hero} + [data-nav-theme]`);
    await expect(band).toHaveAttribute("data-nav-theme", "dark");
    // The six product previews live in the band, not in the hero.
    await expect(band.locator('[data-lenis-prevent], [aria-hidden="true"]').first()).toBeAttached();
    await expect(page.locator(`${hero} [data-lenis-prevent]`)).toHaveCount(0);
    const heroBox = (await page.locator(hero).boundingBox())!;
    const bandBox = (await band.boundingBox())!;
    // The band rises over the hero by its corner radius (28 or 36 px).
    expect(Math.abs(bandBox.y - (heroBox.y + heroBox.height))).toBeLessThanOrEqual(40);
  });

  test("still links 'How we build' to the process section", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "the button is hidden below 640 px");
    await page.goto("/");
    await expect(page.getByRole("link", { name: "How we build" })).toHaveAttribute("href", "#how-we-build");
    await expect(page.locator("#how-we-build")).toHaveCount(1);
  });
});
