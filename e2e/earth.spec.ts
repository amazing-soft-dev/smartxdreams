import { expect, test } from "@playwright/test";

const hero = 'section[aria-labelledby="home-hero-title"]';

test.describe("Earth backdrop on Home", () => {
  test("paints the CSS planet and the cloud symbol with the page", async ({ page }) => {
    await page.goto("/");
    const fallback = page.locator(`${hero} [data-earth-fallback]`);
    await expect(fallback).toHaveCount(1);
    await expect(fallback).toHaveAttribute("aria-hidden", "true");
    // The cloud symbol is drawn and has a size, at every breakpoint.
    const symbol = fallback.locator("svg");
    await expect(symbol).toHaveCount(1);
    const box = await symbol.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(20);
  });

  test("keeps the CSS planet and never loads the scene with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(`${hero} [data-earth-fallback]`)).toBeVisible();
    // Give an idle callback and a chunk load time to happen, if they were going to.
    await page.waitForTimeout(3000);
    await expect(page.locator(`${hero} canvas`)).toHaveCount(0);
  });

  test("fades the WebGL planet in where WebGL 2 is available", async ({ page }) => {
    await page.goto("/");
    const capable = await page.evaluate(() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      // useSceneSupport keeps the fallback on two cores or fewer.
      return Boolean(gl) && (navigator.hardwareConcurrency ?? 8) > 2;
    });
    test.skip(!capable, "no WebGL 2 on this runner: the CSS planet is the expected result");
    const canvas = page.locator(`${hero} canvas`);
    await expect(canvas).toHaveCount(1, { timeout: 15_000 });
    await expect(canvas).toHaveCSS("opacity", "1", { timeout: 5_000 });
    // The fallback stays underneath, so a lost context still shows a planet.
    await expect(page.locator(`${hero} [data-earth-fallback]`)).toHaveCount(1);
  });
});
