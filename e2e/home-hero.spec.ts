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
    expect(symbol.x).toBeGreaterThanOrEqual(heroBox.x);
    expect(symbol.x + symbol.width).toBeLessThanOrEqual(heroBox.x + heroBox.width);
    // Above the cards band, which rises 16 px over the hero's bottom edge.
    expect(symbol.y + symbol.height).toBeLessThanOrEqual(heroBox.y + heroBox.height - 16);
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
    expect(Math.abs(bandBox.y - (heroBox.y + heroBox.height))).toBeLessThanOrEqual(20);
  });

  test("still links 'How we build' to the process section", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "the button is hidden below 640 px");
    await page.goto("/");
    await expect(page.getByRole("link", { name: "How we build" })).toHaveAttribute("href", "#how-we-build");
    await expect(page.locator("#how-we-build")).toHaveCount(1);
  });
});
