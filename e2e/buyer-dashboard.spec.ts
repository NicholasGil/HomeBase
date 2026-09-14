import { expect, test } from "@playwright/test";

test("buyer login lands on coach and denies another transaction by URL", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("coach-home")).toBeVisible();
  await expect(page.getByTestId("concierge")).toBeVisible();
  await expect(page.getByTestId("concierge-scope")).toContainText("814 Maple Ave");
  await expect(page.getByTestId("concierge-scope")).toContainText("Inspection");
  await expect(page.getByTestId("locked-upsell-search")).toBeVisible();
  await expect(page.getByTestId("locked-upsell-tours")).toBeVisible();
  await expect(page.getByTestId("locked-upsell-pipeline")).toBeVisible();
  await expect(page.getByTestId("locked-upsell-vault")).toBeVisible();
  await expect(page.getByTestId("profile-avatar")).toBeVisible();
  await expect(page.getByText("Blair Chen")).toHaveCount(0);
  await expect(page.getByTestId("app-nav")).toHaveAttribute(
    "data-nav-role",
    "buyer",
  );
  await expect(
    page.getByTestId("app-nav").getByRole("link", { name: "Coach", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByTestId("app-nav").getByRole("link", { name: "Search" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("app-nav").getByRole("link", { name: "Tours" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("app-nav").getByRole("link", { name: "Pipeline" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("app-nav").getByRole("link", { name: "Vault" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("app-nav").getByRole("link", { name: "Command center" }),
  ).toHaveCount(0);
  await expect(page.getByTestId("concierge-fab")).toHaveCount(0);

  await page.goto("/transactions/seed:buyer-b");
  await expect(
    page.getByText("You cannot open this transaction."),
  ).toBeVisible();
  await expect(page.getByText("Blair Chen")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Showings" })).toHaveCount(0);
});

test("a second seeded buyer sees a distinct coach scope", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("concierge-scope")).toContainText("Hi Blair");
  await expect(page.getByText("Alex Rivera")).toHaveCount(0);

  await page.goto("/transactions/seed:buyer-a");
  await expect(
    page.getByText("You cannot open this transaction."),
  ).toBeVisible();
});
