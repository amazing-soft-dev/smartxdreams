import { expect, test } from "@playwright/test";
import { pageRoutes } from "./routes";

/**
 * Link-preview and canonical metadata in the served HTML. A page that sets its own Open Graph data replaces
 * the root layout's whole object, so the social image is checked on every route, not only on Home.
 */
const NOT_FOUND = "/this-page-does-not-exist";
const OG_IMAGE = 'meta[property="og:image"]';
const TWITTER_IMAGE = 'meta[name="twitter:image"]';

for (const route of [...pageRoutes, NOT_FOUND]) {
  test(`${route} has one Open Graph image and one Twitter image`, async ({ page }) => {
    await page.goto(route);
    for (const selector of [OG_IMAGE, TWITTER_IMAGE]) {
      await expect(page.locator(selector), selector).toHaveCount(1);
      await expect(page.locator(selector), selector).toHaveAttribute("content", /^https?:\/\/[^/]+\/opengraph-image(\?|$)/);
    }
  });
}

test("the social image is served as the PNG its metadata describes", async ({ page, request }) => {
  await page.goto("/about");
  const content = await page.locator(OG_IMAGE).getAttribute("content");
  // The metadata names the public origin (NEXT_PUBLIC_SITE_URL); the test server has the image under its own.
  const { pathname, search } = new URL(content ?? "");
  const response = await request.get(pathname + search);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
  // A PNG states its width and height at bytes 16 and 20.
  const png = await response.body();
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", String(png.readUInt32BE(16)));
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", String(png.readUInt32BE(20)));
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", /SmartxDreams/);
});

test("link previews show the page title with the company name", async ({ page }) => {
  await page.goto("/about");
  await expect(page).toHaveTitle("About | SmartxDreams");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "About | SmartxDreams");
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", "About | SmartxDreams");
});

test("Home names itself as canonical", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https?:\/\/[^/]+\/?$/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /^https?:\/\/[^/]+\/?$/);
});

for (const route of [NOT_FOUND, "/waitlist/confirm"]) {
  test(`${route} does not claim another page's address`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  });
}

test("the blog index links the feed", async ({ page }) => {
  await page.goto("/blog");
  const feed = page.locator('link[rel="alternate"][type="application/rss+xml"]');
  await expect(feed).toHaveCount(1);
  await expect(feed).toHaveAttribute("href", /\/blog\/rss\.xml$/);
});
