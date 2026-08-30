import { expect, test } from "@playwright/test";

test("buyer login shows own transaction and denies another by URL", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Inspection" })).toBeVisible();
  await expect(page.getByText("Alex Rivera")).toBeVisible();
  await expect(page.getByText("$450.00")).toBeVisible();
  await expect(page.getByText("Blair Chen")).toHaveCount(0);

  await page.goto("/transactions/seed:buyer-b");
  await expect(
    page.getByText("You cannot open this transaction."),
  ).toBeVisible();
  await expect(page.getByText("Blair Chen")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Showings" })).toHaveCount(0);
});

test("a second seeded buyer sees a distinct file", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page.getByRole("heading", { name: "Showings" })).toBeVisible();
  await expect(page.getByText("Blair Chen")).toBeVisible();
  await expect(page.getByText("Alex Rivera")).toHaveCount(0);

  await page.goto("/transactions/seed:buyer-a");
  await expect(
    page.getByText("You cannot open this transaction."),
  ).toBeVisible();
});
