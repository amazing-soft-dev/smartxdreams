import { expect, type Page, test } from "@playwright/test";

/**
 * "Pause animations" in the footer (WCAG 2.2.2 Pause, Stop, Hide): one press holds everything that moves on
 * its own for more than five seconds, on every page, until it is pressed again. CSS loops are checked by
 * their play state, script loops by their output standing still. Each test waits for the network to settle
 * first, so the button has hydrated before it is pressed.
 */
const root = "html";
const tickerTrack = '[data-motion="ticker"] > div';
const starLayers = "footer [data-footer-stars] > div";
const skyStar = "[data-starfield-sky] [data-star]";
const typed = '[data-motion="typed"]';

const toggle = (page: Page) => page.locator("footer").getByRole("button", { name: /^(Pause|Play) animations$/ });

/** The play state of every animation on every match: "running" or "paused" (one entry per animation). */
const playStates = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) => els.flatMap((el) => getComputedStyle(el).animationPlayState.split(", ")));

const typedText = (page: Page) => page.locator(typed).evaluate((el) => el.textContent);

// Two cores: Home keeps its still planet instead of starting the WebGL scene (useSceneSupport), as in
// earth.spec.ts. Nothing here reads the scene, and drawing it on the CPU in several workers at once slowed
// the whole suite enough to time other tests out. The still planet's drift is a CSS loop, held like the rest.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 }));
});

test("pressing the button holds every loop, and pressing it again lets them run", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const button = toggle(page);
  await expect(button).toHaveText("Pause animations");
  await expect(button).toHaveText("Pause animations");
  await expect(page.locator(root)).not.toHaveAttribute("data-motion-paused");

  // Playing: the ticker and the footer's three star layers run, and the typed word keeps changing.
  expect(await playStates(page, tickerTrack)).toEqual(["running"]);
  expect(await playStates(page, starLayers)).toEqual(["running", "running", "running"]);
  const before = await typedText(page);
  await expect.poll(() => typedText(page)).not.toBe(before);

  await button.click();
  await expect(page.locator(root)).toHaveAttribute("data-motion-paused", "");
  await expect(button).toHaveText("Play animations");
  await expect(button).toHaveText("Play animations");

  // Paused: the CSS loops hold their frame (the hero sky's stars twinkle and pulse: two animations each).
  expect(await playStates(page, tickerTrack)).toEqual(["paused"]);
  expect(await playStates(page, starLayers)).toEqual(["paused", "paused", "paused"]);
  expect(new Set(await playStates(page, skyStar))).toEqual(new Set(["paused"]));
  expect(await playStates(page, `${typed} [class*="caret-blink"]`)).toEqual(["paused"]);
  // The typed word stops where it is: longer than any step of typing, holding or deleting.
  const held = await typedText(page);
  await page.waitForTimeout(2500);
  expect(await typedText(page)).toBe(held);

  await button.click();
  await expect(page.locator(root)).not.toHaveAttribute("data-motion-paused");
  await expect(button).toHaveText("Pause animations");
  await expect(button).toHaveText("Pause animations");
  expect(await playStates(page, tickerTrack)).toEqual(["running"]);
  expect(await playStates(page, starLayers)).toEqual(["running", "running", "running"]);
  await expect.poll(() => typedText(page)).not.toBe(held);
});

test("the choice survives a page change, a fresh load and is forgotten when animations play again", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await toggle(page).click();
  await expect(page.locator(root)).toHaveAttribute("data-motion-paused", "");

  // A link click (a client-side page change): still paused on the new page.
  await page.locator('footer nav a[href="/about"]').click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator(root)).toHaveAttribute("data-motion-paused", "");
  await expect(toggle(page)).toHaveText("Play animations");

  // A fresh load of another page: the remembered choice is applied once the page has hydrated.
  await page.goto("/contact", { waitUntil: "networkidle" });
  await expect(page.locator(root)).toHaveAttribute("data-motion-paused", "");
  await expect(toggle(page)).toHaveText("Play animations");
  await expect(toggle(page)).toHaveText("Play animations");
  expect(await playStates(page, starLayers)).toEqual(["paused", "paused", "paused"]);

  // Playing again is remembered too.
  await toggle(page).click();
  await expect(page.locator(root)).not.toHaveAttribute("data-motion-paused");
  await page.reload({ waitUntil: "networkidle" });
  await expect(toggle(page)).toHaveText("Pause animations");
  await expect(page.locator(root)).not.toHaveAttribute("data-motion-paused");
  expect(await playStates(page, starLayers)).toEqual(["running", "running", "running"]);
});

test("the button is reached by keyboard, shows a focus ring and is at least 44 px tall", async ({ page }) => {
  await page.goto("/privacy", { waitUntil: "networkidle" });
  const button = toggle(page);
  // Tab from the bottom bar's last link lands on it.
  await page.locator('footer a[href="/terms"]').last().focus();
  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  const ring = await button.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(ring.style).toBe("solid");
  expect(ring.width).toBeGreaterThanOrEqual(2);
  const box = (await button.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);

  // Space and Enter both press it.
  await page.keyboard.press("Space");
  await expect(page.locator(root)).toHaveAttribute("data-motion-paused", "");
  await expect(button).toHaveText("Play animations");
  await page.keyboard.press("Enter");
  await expect(page.locator(root)).not.toHaveAttribute("data-motion-paused");
  await expect(button).toHaveText("Pause animations");
});
