import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { pageRoutes } from "./routes";

/** WCAG 2.2 A and AA, the target in docs/a11y.md. */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * axe on every page, on both projects. The page is checked in its settled state: reduced motion is emulated,
 * transitions are switched off (the header changes colour as sections pass under it) and scroll-reveal content
 * is made visible, so colour-contrast never measures half-faded or mid-transition colours.
 * Critical and serious issues fail the run; moderate and minor ones are reported in the test output.
 */
for (const route of [...pageRoutes, "/this-page-does-not-exist"]) {
  test(`${route} has no serious accessibility issues`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Fonts, images and late chunks loaded, so colours are measured against the final backgrounds.
    await page.goto(route, { waitUntil: "networkidle" });
    await page.addStyleTag({
      content:
        "*,*::before,*::after{transition:none!important;animation:none!important}[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}",
    });
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const blocking = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    const others = results.violations.filter((v) => !blocking.includes(v));
    if (others.length > 0) {
      console.log(`${route}: ${others.map((v) => `${v.impact} ${v.id} (${v.nodes.length})`).join(", ")}`);
    }
    expect(
      blocking.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
      `${route} has serious accessibility issues`,
    ).toEqual([]);
  });
}
