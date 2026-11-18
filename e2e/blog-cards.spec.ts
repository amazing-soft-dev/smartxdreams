import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * A blog card is one link: the title's ::after covers the whole card. The hover effects (lift, cover drift,
 * "Read" badge) must not shrink that link to the text column, so a click on the cover of a hovered card
 * has to open the post. Hover only exists on the desktop project.
 */
test.describe("blog cards", () => {
  test.skip(({ isMobile }) => isMobile, "hover effects are pointer-only");

  /** Hovers the card's cover, waits for the hover transitions to settle, then clicks the same point. */
  async function clickHoveredCover(page: Page, card: Locator) {
    const href = await card.getByRole("link").getAttribute("href");
    expect(href).toMatch(/^\/blog\/[a-z0-9-]+$/);
    const cover = card.locator(":scope > div").first();
    await cover.scrollIntoViewIfNeeded();
    const box = await cover.boundingBox();
    if (!box) throw new Error("The card cover has no box");
    // Left of centre, away from the text column of the featured card.
    const x = box.x + box.width * 0.3;
    const y = box.y + box.height * 0.5;
    await page.mouse.move(x, y);
    await page.waitForTimeout(700);
    await page.mouse.click(x, y);
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  }

  test("clicking the featured card's cover while hovered opens the post", async ({ page }) => {
    await page.goto("/blog");
    await clickHoveredCover(page, page.locator("section[aria-labelledby='featured-title'] article"));
  });

  test("clicking a grid card's cover while hovered opens the post", async ({ page }) => {
    await page.goto("/blog");
    // The static page shows a Suspense fallback grid. BlogBrowser replaces those articles when it
    // hydrates, and a cover found in the fallback is detached mid-scroll. The post-card id exists
    // only on the hydrated grid.
    const card = page.locator("section[aria-labelledby='articles-title'] [id^='post-card-'] article").first();
    await clickHoveredCover(page, card);
  });
});
