import { expect, test } from "@playwright/test";

test("FLAG_ESIGN off rejects provider send and sign", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/sign");
  await expect(page.getByTestId("esign-workflow")).toBeVisible();
  await expect(page.getByTestId("esign-status")).toContainText("prepare");
  await expect(page.getByTestId("esign-flag")).toContainText("off");
  await expect(page.getByTestId("esign-explain")).toBeVisible();
  await expect(page.getByTestId("esign-section-earnest-money")).toBeVisible();
  await expect(page.getByText("Ask my agent").first()).toBeVisible();

  await page.getByTestId("esign-send").click();
  await expect(page.getByTestId("esign-gate")).toContainText("ESIGN_NOT_ENABLED");
  await page.getByTestId("esign-sign").click();
  await expect(page.getByTestId("esign-gate")).toContainText("ESIGN_NOT_ENABLED");
});

test("FLAG_IDV off and disallowed state reject high-risk actions", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/identity");
  await expect(page.getByTestId("identity-security")).toBeVisible();
  await expect(page.getByTestId("idv-flag")).toContainText("off");
  await expect(page.getByTestId("idv-state")).toContainText("AL");
  await expect(page.getByTestId("idv-state")).toContainText("allowed: no");
  await expect(page.getByTestId("biometric-stored")).toContainText("none");

  await page.getByTestId("idv-action-financial_document").click();
  await expect(page.getByTestId("idv-gate")).toContainText("IDV_NOT_ENABLED");
  await page.getByTestId("idv-action-designated_document").click();
  await expect(page.getByTestId("idv-gate")).toContainText("IDV_NOT_ENABLED");
  await page.getByTestId("idv-action-account_recovery").click();
  await expect(page.getByTestId("idv-gate")).toContainText("IDV_NOT_ENABLED");

  await page.getByTestId("biometric-unlock-button").click();
  await expect(page.getByTestId("biometric-stored")).toContainText("none");
});

test("feature flags stay off including e-sign and idv", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("FLAG_ESIGN")).toBeVisible();
  await expect(page.getByText("FLAG_IDV")).toBeVisible();
  await expect(page.getByText("E-signature providers")).toBeVisible();
  await expect(page.getByText("Vendor identity verification")).toBeVisible();
  await expect(page.getByText("off").first()).toBeVisible();
});

test("vendor cannot open the signature or identity pages", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
  await page.goto("/sign");
  await expect(page.getByTestId("esign-denied")).toBeVisible();
  await page.goto("/identity");
  await expect(page.getByTestId("idv-denied")).toBeVisible();
});
