import { expect, test } from "@playwright/test";

const hero = 'section[aria-labelledby="home-hero-title"]';

test.describe("Earth backdrop on Home", () => {
  test("paints the starfield sky and the painted plate with the page", async ({ page }) => {
    await page.goto("/");
    const fallback = page.locator(`${hero} [data-earth-fallback]`);
    await expect(fallback).toHaveCount(1);
    await expect(fallback).toHaveAttribute("aria-hidden", "true");
    // The Framer-style sky: 200 stars.
    await expect(fallback.locator("[data-starfield-sky] circle[data-star]")).toHaveCount(200);
    // The plate twice (the planet and its glow), loaded, wider than the hero and sharing one variant.
    const plates = fallback.locator('img[src^="/brand/earth/earth-plate-"]');
    await expect(plates).toHaveCount(2);
    const loaded = await plates.evaluateAll((imgs) =>
      imgs.map((img) => ({ done: (img as HTMLImageElement).complete, src: (img as HTMLImageElement).currentSrc, width: img.getBoundingClientRect().width })),
    );
    const heroWidth = (await page.locator(hero).boundingBox())?.width ?? 0;
    for (const plate of loaded) {
      expect(plate.done).toBe(true);
      expect(plate.width).toBeGreaterThan(heroWidth);
    }
    expect(loaded[0]!.src).toBe(loaded[1]!.src);
  });

  test("keeps everything still with reduced motion: no scene, no twinkle", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(`${hero} [data-earth-fallback] img`).first()).toBeVisible();
    // Give an idle callback and a chunk load time to happen, if they were going to.
    await page.waitForTimeout(3000);
    await expect(page.locator(`${hero} canvas`)).toHaveCount(0);
    const animation = await page
      .locator(`${hero} [data-starfield-sky] circle[data-star]`)
      .first()
      .evaluate((star) => getComputedStyle(star).animationName);
    expect(animation).toBe("none");
  });

  test("fades the WebGL plate in where WebGL 2 is available", async ({ page }) => {
    await page.goto("/");
    const capable = await page.evaluate(() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      // useSceneSupport keeps the fallback on two cores or fewer.
      return Boolean(gl) && (navigator.hardwareConcurrency ?? 8) > 2;
    });
    test.skip(!capable, "no WebGL 2 on this runner: the still plate is the expected result");
    const canvas = page.locator(`${hero} canvas`);
    // Generous waits: with the whole suite running in parallel on software WebGL, decoding and uploading the
    // plate can take many seconds. On its own the fade starts about 0.1 s after the canvas appears.
    await expect(canvas).toHaveCount(1, { timeout: 30_000 });
    await expect(canvas).toHaveCSS("opacity", "1", { timeout: 30_000 });
    // The fallback stays underneath: its sky shows around the planet, and a lost context still shows the plate.
    await expect(page.locator(`${hero} [data-earth-fallback] [data-starfield-sky]`)).toHaveCount(1);
  });
});
