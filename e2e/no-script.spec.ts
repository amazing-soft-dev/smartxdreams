import { expect, test } from "@playwright/test";

/**
 * Without JavaScript no entrance animation ever runs, so the <noscript> style in the root layout has to show
 * everything the server renders in its starting state: scroll reveals ([data-reveal]) and entrances that
 * start from inline styles ([data-motion]), the header among them.
 */
test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const route of ["/", "/about"]) {
    test(`${route} shows the header and the first screen`, async ({ page }) => {
      await page.goto(route);
      const header = page.locator("header");
      await expect(header).toHaveCSS("opacity", "1");
      await expect(header).toHaveCSS("transform", "none");
      await expect(header.getByRole("link", { name: "SmartxDreams home" })).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();

      // Nothing marked as animated is still faded out on the first screen.
      const faded = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("[data-motion], [data-reveal]")]
          .filter((el) => {
            const box = el.getBoundingClientRect();
            return box.width > 0 && box.bottom > 0 && box.top < window.innerHeight && Number(getComputedStyle(el).opacity) < 1;
          })
          .map((el) => `${el.tagName.toLowerCase()}[data-motion="${el.dataset.motion ?? ""}"]`),
      );
      expect(faded).toEqual([]);
    });
  }
});
