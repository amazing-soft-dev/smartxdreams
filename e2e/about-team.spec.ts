import { expect, test } from "@playwright/test";

test("the team section shows nine profiles, each with a portrait, a role and focus areas", async ({ page }) => {
  await page.goto("/about");
  const team = page.getByRole("list", { name: "The team" });
  const cards = team.locator(":scope > li");
  await expect(cards).toHaveCount(9);
  for (const card of await cards.all()) {
    await expect(card.getByRole("heading", { level: 3 })).not.toBeEmpty();
    const portrait = card.locator("img").first();
    // Every portrait is described: who it shows and how.
    await expect(portrait).toHaveAttribute("alt", /\w+ \w+ .{10,}/);
    await expect(card.getByRole("list")).toBeVisible();
  }
  await expect(cards.first().getByRole("heading", { level: 3 })).toHaveText("Isabela Moreno");
});

test("the hiring card's button leads to the contact page", async ({ page }) => {
  await page.goto("/about");
  const card = page.getByRole("heading", { name: "Building with us" }).locator("xpath=ancestor::div[2]");
  await card.getByRole("link", { name: "Get in touch" }).click();
  await expect(page).toHaveURL(/\/contact$/);
});

test("portraits come in from grey and end in full colour", async ({ page }) => {
  await page.goto("/about");
  const portrait = page.locator("[data-motion='portrait']").first();
  await expect(portrait).toHaveCSS("filter", "saturate(0)");
  await portrait.scrollIntoViewIfNeeded();
  await expect(portrait).toHaveCSS("filter", "saturate(1)", { timeout: 5000 });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("portraits are in full colour and level from the start", async ({ page }) => {
    await page.goto("/about");
    const portraits = page.locator("[data-motion='portrait']");
    await expect(portraits).toHaveCount(9);
    for (const portrait of await portraits.all()) {
      await expect(portrait).toHaveCSS("filter", "none");
      await expect(portrait).toHaveCSS("transform", "none");
    }
  });
});
