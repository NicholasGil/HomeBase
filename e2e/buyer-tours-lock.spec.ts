import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

test("buyer direct /tours shows Unlock tours upsell", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/tours");
  await expect(page.getByTestId("locked-upsell-tours")).toBeVisible();
  await expect(page.getByText("Unlock tours")).toBeVisible();
  await expect(page.getByTestId("tour-builder")).toHaveCount(0);
  await expect(page.getByTestId("locked-upsell-search")).toHaveCount(0);
  await expect(page.getByTestId("locked-upsell-pipeline")).toHaveCount(0);
  await expect(page.getByTestId("locked-upsell-vault")).toHaveCount(0);
});
