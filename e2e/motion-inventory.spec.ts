import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { pageRoutes } from "./routes";

/**
 * Animations are easy to drop by accident in a refactor. Every animated element is tagged data-reveal (an
 * entrance) or data-motion (anything else that moves), so each route's count of them is a fingerprint of
 * its motion. e2e/motion-baseline.json holds the counts the site had when the guard was added; a route
 * with fewer fails. After adding motion on purpose, refresh it:
 *
 *   UPDATE_MOTION_BASELINE=1 npx playwright test e2e/motion-inventory.spec.ts --project desktop
 */
const BASELINE = path.join(process.cwd(), "e2e", "motion-baseline.json");
const ANIMATED = "[data-reveal], [data-motion]";

test("every route keeps at least its baseline of animations", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "The counts are the same on every device; one project checks them.");
  test.setTimeout(pageRoutes.length * 15_000);
  const update = Boolean(process.env.UPDATE_MOTION_BASELINE);
  const baseline: Record<string, number> = update ? {} : JSON.parse(readFileSync(BASELINE, "utf8"));
  const counts: Record<string, number> = {};
  for (const route of pageRoutes) {
    await page.goto(route);
    // Count where the route ended up: renamed products' old addresses redirect to the new page.
    const where = new URL(page.url()).pathname;
    counts[where] = await page.locator(ANIMATED).count();
  }
  if (update) {
    writeFileSync(BASELINE, `${JSON.stringify(counts, Object.keys(counts).sort(), 2)}\n`);
    return;
  }
  for (const [route, minimum] of Object.entries(baseline)) {
    expect(counts[route], `${route} has no count: is the page gone?`).toBeDefined();
    expect(counts[route]!, `${route} lost animations (baseline ${minimum})`).toBeGreaterThanOrEqual(minimum);
  }
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const route of ["/", "/about", "/products/joined", "/contact"]) {
    test(`${route}: every animated element ends visible and untransformed`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      // Let hydration attach the in-view triggers, then walk down the page so every one of them fires.
      await page.waitForTimeout(1500);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += Math.round(window.innerHeight * 0.6)) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
      });
      // Opacity still fades under reduced motion (only movement is removed); give it time to finish.
      await page.waitForTimeout(2000);
      const moving = await page.locator(ANIMATED).evaluateAll((els) =>
        els
          .filter((el) => (el as HTMLElement).offsetParent !== null || getComputedStyle(el).position === "fixed")
          .map((el) => {
            const cs = getComputedStyle(el);
            return { el: el.outerHTML.slice(0, 80), opacity: +cs.opacity, transform: cs.transform, filter: cs.filter };
          })
          // Still moving: not yet opaque, moved or scaled, or still blurred or grey (blur(0px) and saturate(1) are at rest).
          .filter(
            (s) =>
              s.opacity < 0.99 ||
              (s.transform !== "none" && !/^matrix\(1, 0, 0, 1, 0, 0\)$/.test(s.transform)) ||
              /blur\((?!0px\))|saturate\(0(\.\d+)?\)/.test(s.filter),
          ),
      );
      expect(moving, JSON.stringify(moving.slice(0, 3))).toEqual([]);
    });
  }
});
