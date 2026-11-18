import { expect, test } from "@playwright/test";
import { pageRoutes } from "./routes";

test.describe("every page", () => {
  test("the build has pages to test", () => {
    expect(pageRoutes.length).toBeGreaterThan(20);
  });

  for (const route of pageRoutes) {
    test(`${route} loads with one h1 and no errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/SmartxDreams/);
      await expect(page.locator("main#main")).toHaveCount(1);
      expect(errors).toEqual([]);
    });
  }
});

test("an unknown address gets the 404 page with a suggestion", async ({ page }) => {
  const response = await page.goto("/prodcts/senioraiplans");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(/Page not found/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "/products/senioraiplans" })).toBeVisible();
});

test("mixed-case addresses redirect to lowercase", async ({ request }) => {
  const response = await request.get("/About", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toMatch(/\/about$/);
});

test("feeds and crawler files are served", async ({ request }) => {
  for (const [file, type] of [
    ["/sitemap.xml", /xml/],
    ["/robots.txt", /text\/plain/],
    ["/llms.txt", /text\/plain/],
    ["/blog/rss.xml", /rss\+xml/],
  ] as const) {
    const response = await request.get(file);
    expect(response.status(), file).toBe(200);
    expect(response.headers()["content-type"], file).toMatch(type);
  }
});

test("security headers are on every response", async ({ request }) => {
  const headers = (await request.get("/")).headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-powered-by"]).toBeUndefined();
});
