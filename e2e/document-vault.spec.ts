import { expect, test } from "@playwright/test";

test("buyer vault route shows locked upsell copy", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/vault");
  await expect(page.getByTestId("locked-upsell-vault")).toBeVisible();
  await expect(page.getByTestId("document-vault")).toHaveCount(0);
});

test("vendor opens assigned documents from the vendor portal", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
  await expect(page.getByTestId("vendor-portal")).toBeVisible();
  await expect(page.getByTestId("vendor-assignment")).toBeVisible();
});
