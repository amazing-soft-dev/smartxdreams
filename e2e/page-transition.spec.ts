import { expect, test } from "@playwright/test";

/**
 * A link click plays the panel transition (docs/motion-audit.md#page-transition): the panels cover the page
 * with the destination's name on them, the route changes underneath, the cover holds so the name can be
 * read, then the panels reveal the new page and focus moves to its h1. The main nav only shows on desktop.
 * Each test waits for the network to settle first: a click before the app router has hydrated plays the
 * cover but can lose the route push, which under a loaded parallel run made the URL checks fail.
 */
test.describe("page transition", () => {
  test.skip(({ isMobile }) => isMobile, "the main nav is desktop-only; the mobile menu navigates instantly");

  test("covers the page with the destination, then reveals it and focuses its title", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const overlay = page.locator("[data-page-transition]");
    await expect(overlay).not.toHaveAttribute("data-state", "active");

    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About", exact: true }).click();

    // Covering: the overlay is up, the page is marked covered and the name is the destination's.
    await expect(overlay).toHaveAttribute("data-state", "active");
    await expect(page.locator("html")).toHaveAttribute("data-page-covered", "");
    await expect(page.locator("[data-transition-label]")).toHaveText("About");

    // The route changes under the cover, and the cover is still up afterwards (the hold).
    await expect(page).toHaveURL(/\/about$/);
    await expect(overlay).toHaveAttribute("data-state", "active");

    // Revealed: the overlay is down and focus is on the new page's title, which is announced.
    await expect(overlay).not.toHaveAttribute("data-state", "active", { timeout: 5_000 });
    await expect(page.locator("html")).not.toHaveAttribute("data-page-covered");
    await expect(page.locator("main h1")).toBeFocused();
    await expect(page.getByRole("status").filter({ hasText: "About page" })).toBeAttached();
  });

  test("holds the closed cover long enough to read the name", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Time from the moment every panel is in place to the moment the first one starts leaving.
    await page.evaluate(() => {
      const w = window as unknown as { __closed?: number; __leaving?: number };
      const panels = [...document.querySelectorAll<HTMLElement>("[data-page-transition] [data-panel]")];
      const tick = () => {
        const now = performance.now();
        const at = panels.map((p) => new DOMMatrixReadOnly(getComputedStyle(p).transform).m42);
        const closed = at.every((y) => Math.abs(y) < 0.5);
        if (closed && w.__closed === undefined) w.__closed = now;
        if (w.__closed !== undefined && !closed && w.__leaving === undefined) w.__leaving = now;
        if (w.__leaving === undefined) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Blog", exact: true }).click();
    await expect(page).toHaveURL(/\/blog$/);
    const held = await page.waitForFunction(
      () => {
        const w = window as unknown as { __closed?: number; __leaving?: number };
        return w.__leaving !== undefined && w.__closed !== undefined ? w.__leaving - w.__closed : null;
      },
      undefined,
      { timeout: 6_000 },
    );
    // 700 ms readable, then the name's exit (about 500 ms) before the panels move.
    expect(await held.jsonValue()).toBeGreaterThanOrEqual(1_000);
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("navigates without the overlay but still focuses the new title", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contact", exact: true }).click();
      await expect(page).toHaveURL(/\/contact$/);
      await expect(page.locator("[data-page-transition]")).not.toHaveAttribute("data-state", "active");
      await expect(page.locator("main h1")).toBeFocused();
    });
  });
});
