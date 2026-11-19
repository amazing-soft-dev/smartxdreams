import { expect, test } from "@playwright/test";

/**
 * Keyboard focus follows the visitor (docs/a11y.md, "Page changes"). A button that points at a section of its
 * own page moves focus to that section, and every route change lands on the new page's h1: through plain
 * links, the menus and the back button, not only behind the panel transition (page-transition.spec.ts).
 * Each test waits for the network to settle first, so the app router has hydrated before the first key press.
 */

test("Join the waitlist moves focus to the form, so Tab reaches the email field", async ({ page }) => {
  await page.goto("/products/joined", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Join the waitlist", exact: true }).focus();
  await page.keyboard.press("Enter");

  // The section, not the page title: a change of hash alone is not a new page.
  const section = page.locator("#waitlist");
  await expect(page).toHaveURL(/#waitlist$/);
  await expect(section).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(section.getByLabel("Email address")).toBeFocused();
  await expect(section).toBeInViewport();
});

test("a Products menu link lands on the new page's title", async ({ page, isMobile }) => {
  test.skip(isMobile, "the Products menu is desktop-only");
  await page.goto("/about", { waitUntil: "networkidle" });
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("button", { name: "Products" }).focus();
  await page.keyboard.press("Enter");
  const item = nav.locator("[data-menu-item]").first();
  await expect(item).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(item).toBeFocused();
  const href = await item.getAttribute("href");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator("main h1")).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: /\S page$/ })).toBeAttached();
});

test("a mobile menu link lands on the new page's title once the menu has closed", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the menu button is for phones and tablets");
  await page.goto("/about", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Contact", exact: true }).click();

  await expect(page).toHaveURL(/\/contact$/);
  // Closing the dialog hands focus back to the menu button first; the title takes it when the route changes.
  await expect(page.locator("main h1")).toBeFocused();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("the back button returns to the scroll position and focuses the title", async ({ page }) => {
  await page.goto("/products/joined", { waitUntil: "networkidle" });
  // A plain link far down the page: the privacy policy beside the waitlist form.
  const link = page.locator("#waitlist").getByRole("link", { name: "Privacy policy" });
  await link.scrollIntoViewIfNeeded();
  const scrollY = () => page.evaluate(() => Math.round(window.scrollY));
  const before = await scrollY();
  expect(before).toBeGreaterThan(500);
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.locator("main h1")).toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(/\/products\/joined$/);
  await expect(page.locator("main h1")).toBeFocused();
  // Focus moved without scrolling, so the browser's restored position stands.
  await expect.poll(async () => Math.abs((await scrollY()) - before)).toBeLessThan(4);
});
