import { expect, type Locator, test } from "@playwright/test";

const hero = 'section[aria-labelledby="home-hero-title"]';
/** The WebGL scene's canvas, not the fallback's two plate canvases. */
const sceneCanvas = `${hero} canvas:not([data-earth-plate])`;

/** True once a 2D canvas has something drawn in it (any pixel with alpha). */
const isDrawn = (canvas: Locator) =>
  canvas.evaluate((element) => {
    const c = element as HTMLCanvasElement;
    if (c.width === 0 || c.height === 0) return false;
    const data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < data.length; i += 4 * 97) if (data[i]! > 0) return true;
    return false;
  });

test.describe("Earth backdrop on Home", () => {
  test("paints the starfield sky and the painted plate", async ({ page }) => {
    await page.goto("/");
    const fallback = page.locator(`${hero} [data-earth-fallback]`);
    await expect(fallback).toHaveCount(1);
    await expect(fallback).toHaveAttribute("aria-hidden", "true");
    // The Framer-style sky: 200 stars.
    await expect(fallback.locator("[data-starfield-sky] circle[data-star]")).toHaveCount(200);
    // The plate, drawn into two canvases (the planet and its glow) wider than the hero.
    const heroWidth = (await page.locator(hero).boundingBox())?.width ?? 0;
    for (const part of ["planet", "glow"]) {
      const canvas = fallback.locator(`canvas[data-earth-plate="${part}"]`);
      await expect(canvas).toHaveCount(1);
      await expect.poll(() => isDrawn(canvas), { timeout: 20_000 }).toBe(true);
      expect((await canvas.boundingBox())?.width ?? 0).toBeGreaterThan(heroWidth * 0.75);
    }
  });

  test("keeps everything still with reduced motion: no scene, no twinkle, the plate still drawn", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const planet = page.locator(`${hero} canvas[data-earth-plate="planet"]`);
    await expect.poll(() => isDrawn(planet), { timeout: 20_000 }).toBe(true);
    // Give an idle callback and a chunk load time to happen, if they were going to.
    await page.waitForTimeout(3000);
    await expect(page.locator(sceneCanvas)).toHaveCount(0);
    const animation = await page
      .locator(`${hero} [data-starfield-sky] circle[data-star]`)
      .first()
      .evaluate((star) => getComputedStyle(star).animationName);
    expect(animation).toBe("none");
    // The still planet does not drift either.
    await expect(page.locator(`${hero} [data-earth-fallback]`)).not.toHaveAttribute("data-drift");
    expect(await planet.evaluate((c) => getComputedStyle(c).animationName)).toBe("none");
  });

  test("lets the still planet drift where the scene will not run but motion is welcome", async ({ page }) => {
    // Two cores: useSceneSupport keeps the fallback (low power), but the visitor has not asked for stillness.
    await page.addInitScript(() => Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 }));
    await page.goto("/");
    const fallback = page.locator(`${hero} [data-earth-fallback]`);
    await expect(fallback).toHaveAttribute("data-drift", "");
    // Both canvases' offsets, read in the same frame.
    const offsets = () =>
      fallback.evaluate((root) =>
        ["planet", "glow"].map((part) => getComputedStyle(root.querySelector(`canvas[data-earth-plate="${part}"]`)!).translate),
      );
    const [first, glowFirst] = await offsets();
    // The planet and its glow move together, and they keep moving (slowly: a few px over seconds).
    expect(glowFirst).toBe(first);
    await expect.poll(async () => (await offsets())[0], { timeout: 10_000 }).not.toBe(first);
    await page.waitForTimeout(1500);
    await expect(page.locator(sceneCanvas)).toHaveCount(0);
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
    const canvas = page.locator(sceneCanvas);
    // Generous waits: with the whole suite running in parallel on software WebGL, decoding and uploading the
    // plate can take many seconds. On its own the fade starts about 0.1 s after the canvas appears.
    await expect(canvas).toHaveCount(1, { timeout: 30_000 });
    await expect(canvas).toHaveCSS("opacity", "1", { timeout: 30_000 });
    // The fallback stays underneath: its sky shows around the planet, and a lost context still shows the plate.
    await expect(page.locator(`${hero} [data-earth-fallback] [data-starfield-sky]`)).toHaveCount(1);
  });
});
