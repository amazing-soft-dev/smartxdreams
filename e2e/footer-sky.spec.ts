import { expect, type Page, test } from "@playwright/test";

const stars = "footer [data-footer-stars]";
const layers = `${stars} > div`;
const ridge = "footer [data-footer-ridge]";
/** The aurora's root: the parent of its canvas. */
const aurora = "footer div:has(> canvas)";

/** Scrolls the footer into view (smooth scrolling may take a moment to settle). */
async function toFooter(page: Page) {
  await page.goto("/");
  await expect
    .poll(async () => {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      return page.locator("footer").evaluate((f) => f.getBoundingClientRect().top < window.innerHeight);
    })
    .toBe(true);
}

/** The cursor variables the aurora writes on the star layers' wrapper. */
const pointerVars = (page: Page) =>
  page.locator(stars).evaluate((el) => {
    const style = (el as HTMLElement).style;
    return { x: style.getPropertyValue("--pointer-x"), y: style.getPropertyValue("--pointer-y") };
  });

test.describe("Footer night sky", () => {
  test("shows round drifting stars, the aurora and the ridge the bottom bar stands on", async ({ page }) => {
    await toFooter(page);

    // Three depth layers of round box-shadow stars, each drifting upward on its own loop.
    await expect(page.locator(layers)).toHaveCount(3);
    const styles = await page.locator(layers).evaluateAll((els) =>
      els.map((el) => {
        const cs = getComputedStyle(el);
        return { radius: cs.borderRadius, animation: cs.animationName, duration: cs.animationDuration, shadows: (cs.boxShadow.match(/rgb/g) ?? []).length };
      }),
    );
    for (const layer of styles) {
      expect(layer.radius).toBe("50%");
      expect(layer.animation).not.toBe("none");
      expect(layer.shadows).toBeGreaterThan(50);
    }
    expect(styles.map((s) => s.duration)).toEqual(["50s", "100s", "150s"]);

    // The aurora loads once the footer is near, and stands on the ridge.
    await expect(page.locator(`${aurora} > canvas`)).toHaveCount(1, { timeout: 20_000 });
    const [footerBox, ridgeBox] = await Promise.all([page.locator("footer").boundingBox(), page.locator(ridge).boundingBox()]);
    expect(Math.abs(ridgeBox!.y + ridgeBox!.height - (footerBox!.y + footerBox!.height))).toBeLessThanOrEqual(1);
    const base = await page.locator(aurora).evaluate((el) => (el as HTMLElement).style.getPropertyValue("--aurora-base"));
    const crest = ((ridgeBox!.y + ridgeBox!.height * 0.2 - footerBox!.y) / footerBox!.height) * 100;
    expect(Math.abs(parseFloat(base) - crest)).toBeLessThan(0.5);
  });

  test("leans the aurora and shifts the stars toward a mouse, and settles when it leaves", async ({ page, isMobile }) => {
    test.skip(isMobile, "touch screens have no cursor to follow");
    await toFooter(page);
    const live = page.locator(`${aurora}[data-live]`);
    // The cursor drives the WebGL scene's loop; without WebGL the still aurora shows and nothing follows.
    const capable = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl")));
    test.skip(!capable, "no WebGL on this runner: the still aurora is the expected result");
    await expect(live).toHaveCount(1, { timeout: 20_000 });

    const footer = (await page.locator("footer").boundingBox())!;
    await page.mouse.move(footer.x + footer.width - 40, footer.y + 40, { steps: 6 });
    await expect.poll(async () => parseFloat((await pointerVars(page)).x || "0")).toBeGreaterThan(0.5);
    expect(parseFloat((await pointerVars(page)).y)).toBeGreaterThan(0.3);
    // Near layers move most, against the cursor.
    const shifts = await page.locator(layers).evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).translate)));
    expect(shifts[0]!).toBeLessThan(0);
    expect(shifts[2]!).toBeLessThan(shifts[1]!);
    expect(shifts[1]!).toBeLessThan(shifts[0]!);

    // The footer's links still take the pointer through the sky.
    const link = page.locator("footer nav a").first();
    await link.hover();
    await expect(link).toHaveCSS("color", /rgb\(255, 255, 255\)|oklab\(0\.99/);

    // Leaving: everything eases back to rest.
    await page.mouse.move(footer.x + footer.width / 2, 2, { steps: 4 });
    await expect.poll(async () => (await pointerVars(page)).x, { timeout: 10_000 }).toBe("0.0000");
  });

  test("keeps the sky still with reduced motion: no drift, no live aurora, no cursor response", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await toFooter(page);
    await expect(page.locator(`${aurora} > canvas`)).toHaveCount(1, { timeout: 20_000 });
    // Give the scene a moment to start, if it were going to.
    await page.waitForTimeout(1500);
    await expect(page.locator(`${aurora}[data-live]`)).toHaveCount(0);
    const transforms = await page.locator(layers).evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));
    expect(transforms).toEqual(["none", "none", "none"]);
    const footer = (await page.locator("footer").boundingBox())!;
    await page.mouse.move(footer.x + footer.width - 40, footer.y + 40, { steps: 4 });
    await page.waitForTimeout(500);
    expect(await pointerVars(page)).toEqual({ x: "", y: "" });
  });
});
