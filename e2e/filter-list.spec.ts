import { expect, test } from "@playwright/test";

const list = "main ul.grid";
/** Each card, named by the product page it links to. */
const cards = `${list} > li`;

type Frame = Record<string, { x: number; y: number }>;

/**
 * The filtered lists (products, blog) animate layout: when a filter changes, the cards that stay glide to
 * their new places. That needs Motion's layout features, which every other page does without: MotionProvider
 * gives the site the lighter set, and FilterList wraps itself in a LazyMotion with the full one. Without
 * them the cards would jump. So: change the filter, record where every card is on every frame, and check
 * that a card that ends somewhere else passed through the places in between.
 */
test("cards that stay glide to their new places when the products filter changes", async ({ page }) => {
  // With the whole suite running in parallel the page can take many seconds to hydrate and start its entrance.
  test.setTimeout(90_000);
  await page.goto("/products", { waitUntil: "networkidle" });
  const chips = page.getByRole("group", { name: "Filter products by audience" }).getByRole("button");
  await expect(chips.first()).toHaveAttribute("aria-pressed", "true");
  await page.locator(list).scrollIntoViewIfNeeded();
  // The list rises in as one block when it is first seen; wait until it rests, so only the filter moves cards.
  const top = () => page.locator(cards).first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await expect
    .poll(
      async () => {
        const before = await top();
        await page.waitForTimeout(250);
        return Math.abs((await top()) - before);
      },
      { timeout: 30_000 },
    )
    .toBeLessThan(0.1);

  // Record every card's position on every frame until told to stop.
  await page.evaluate((selector) => {
    const w = window as unknown as { __frames: Frame[]; __recording: boolean };
    w.__frames = [];
    w.__recording = true;
    const tick = () => {
      const frame: Frame = {};
      for (const li of document.querySelectorAll(selector)) {
        const href = li.querySelector("a")?.getAttribute("href");
        const box = li.getBoundingClientRect();
        if (href) frame[href] = { x: box.left + window.scrollX, y: box.top + window.scrollY };
      }
      w.__frames.push(frame);
      if (w.__recording) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, cards);

  // The last audience's product is not first in the full list, so its card has to move up.
  await chips.last().click();
  await expect(chips.last()).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.locator(cards).count()).toBeLessThan(6);
  // Longer than the glide (0.46 s plus the stagger).
  await page.waitForTimeout(1500);

  const glides = await page.evaluate(() => {
    const w = window as unknown as { __frames: Frame[]; __recording: boolean };
    w.__recording = false;
    const frames = w.__frames;
    const first = frames[0]!;
    const last = frames.at(-1)!;
    const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
    return Object.keys(last)
      .filter((href) => first[href] && distance(first[href], last[href]!) > 20)
      .map((href) => ({
        href,
        // Frames where the card is neither where it started nor where it ends.
        between: frames.filter((f) => f[href] && distance(f[href], first[href]!) > 4 && distance(f[href], last[href]!) > 4).length,
      }));
  });
  expect(glides.length, "no remaining card changed place: pick a filter that moves one").toBeGreaterThan(0);
  for (const card of glides) expect(card.between, `${card.href} jumped to its new place`).toBeGreaterThan(3);
});
