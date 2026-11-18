import { expect, type Page, test } from "@playwright/test";

/** The header bar's home link (the mobile menu dialog inside <header> has one of its own). */
const headerLogo = (page: Page) => page.locator('header a[aria-label="SmartxDreams home"]').first();

/** The visible header logo's mark file: the one of the two stacked logos that is not faded out. */
async function visibleHeaderMark(page: Page): Promise<string> {
  return headerLogo(page)
    .locator("img")
    .evaluateAll((imgs) =>
      imgs
        .filter((img) => Number(getComputedStyle(img.closest("[class*='opacity-']")!).opacity) > 0.9)
        .map((img) => (img as HTMLImageElement).currentSrc.split("/").pop() ?? "")
        .join(","),
    );
}

test("the header shows the white mark over dark sections and the charcoal one over light", async ({ page }) => {
  await page.goto("/about");
  await expect.poll(() => visibleHeaderMark(page)).toMatch(/^smartxdreams-mark-on-dark-\d+\.webp$/);

  // Scroll a light section under the header (and back up a touch, so the header is not tucked away).
  await page.evaluate(() => {
    const light = document.querySelector<HTMLElement>("[data-nav-theme='light']")!;
    window.scrollTo(0, light.getBoundingClientRect().top + window.scrollY - 20);
  });
  await page.waitForTimeout(800);
  await page.mouse.wheel(0, -10);
  await expect.poll(() => visibleHeaderMark(page)).toMatch(/^smartxdreams-mark-on-light-\d+\.webp$/);
});

test("both header marks are loaded before they are needed", async ({ page }) => {
  await page.goto("/");
  const imgs = headerLogo(page).locator("img");
  await expect(imgs).toHaveCount(2);
  await expect
    .poll(() => imgs.evaluateAll((all) => all.every((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)))
    .toBe(true);
});
