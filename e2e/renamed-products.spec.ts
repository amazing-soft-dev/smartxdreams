import { expect, test } from "@playwright/test";

/** Old product addresses and where they live now (src/content/products/retired.ts). */
const renamed = [
  { old: "/products/jobatlas", now: "/products/joined", name: "Joined" },
  { old: "/products/applypilot", now: "/products/acorn", name: "Acorn" },
  { old: "/products/kinly", now: "/products/senioraiplans", name: "SeniorAIPlans" },
];

for (const { old, now, name } of renamed) {
  test(`${old} redirects permanently to ${now}`, async ({ request }) => {
    const response = await request.get(old, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(new URL(response.headers()["location"]!, "http://x").pathname).toBe(now);
  });

  test(`${old} lands on the ${name} page`, async ({ page }) => {
    await page.goto(old);
    await expect(page).toHaveURL(new RegExp(`${now}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  });
}

test("a mixed-case old address still reaches the renamed product", async ({ page }) => {
  await page.goto("/Products/Kinly");
  await expect(page).toHaveURL(/\/products\/senioraiplans$/);
});
