import { expect, test } from "@playwright/test";

/**
 * The About page credits every photo on the site. Each credit shows the photo it credits as a thumbnail,
 * so a reader can tell which credit belongs to which picture.
 */
test("every About page credit shows its photo", async ({ page }) => {
  await page.goto("/about");
  const credits = page.locator("section[aria-labelledby='photo-credits-title'] li");
  const count = await credits.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const credit = credits.nth(i);
    await expect(credit).toContainText(/Photo by .+ on (Unsplash|Pexels)/);
    const thumb = credit.locator("[data-credit-thumb] img");
    await expect(thumb).toHaveCount(1);
    await thumb.scrollIntoViewIfNeeded();
    // Loaded (lazy images load once scrolled near) with real pixels.
    await expect.poll(() => thumb.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const box = await thumb.boundingBox();
    expect(box?.width).toBeGreaterThan(40);
  }
});

test("credit thumbnails are hidden from screen readers", async ({ page }) => {
  await page.goto("/about");
  const thumbs = page.locator("section[aria-labelledby='photo-credits-title'] [data-credit-thumb]");
  await expect(thumbs.first()).toBeAttached();
  for (const thumb of await thumbs.all()) await expect(thumb).toHaveAttribute("aria-hidden", "true");
});
