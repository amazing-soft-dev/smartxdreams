import { expect, test } from "@playwright/test";

/** The tick line above the "How we build" steps: its track of ticks, and the 01 / 04 counter after it. */
const tickLine = "#how-we-build [aria-hidden='true'].mt-10";

for (const width of [1024, 1475]) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("the tick line spans the content row, with the counter at its right edge", async ({ page }) => {
      await page.goto("/");
      const row = page.locator(tickLine);
      await row.scrollIntoViewIfNeeded();
      await expect(row).toBeVisible();
      const m = await row.evaluate((el) => {
        const container = el.parentElement!;
        const style = getComputedStyle(container);
        const box = container.getBoundingClientRect();
        const left = box.left + parseFloat(style.paddingLeft);
        const right = box.right - parseFloat(style.paddingRight);
        const ticks = [...el.firstElementChild!.children].map((t) => t.getBoundingClientRect());
        const counter = el.lastElementChild!.getBoundingClientRect();
        return { left, right, first: ticks[0]!.left, lastTick: ticks.at(-1)!.right, counterRight: counter.right, count: ticks.length };
      });
      // From the content's left edge to the counter at its right edge: at least 95% of the row.
      expect(Math.abs(m.first - m.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(m.counterRight - m.right)).toBeLessThanOrEqual(1);
      expect((m.lastTick - m.first) / (m.right - m.left)).toBeGreaterThan(0.85);
      expect((m.counterRight - m.first) / (m.right - m.left)).toBeGreaterThanOrEqual(0.95);
      expect(m.count).toBeGreaterThan(100);
    });
  });
}

test.describe("with reduced motion", () => {
  test.use({ viewport: { width: 1475, height: 900 }, reducedMotion: "reduce" });

  test("there is no tick line, and every step is listed", async ({ page }) => {
    await page.goto("/");
    // The tick line is in the markup either way (server and client must match) and CSS hides it.
    await expect(page.locator(tickLine)).toBeHidden();
    await expect(page.locator("#how-we-build ol > li")).toHaveCount(4);
  });
});
