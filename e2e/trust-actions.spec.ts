import { expect, type Page, test } from "@playwright/test";

async function expectNoRuntimeOverlay(page: Page) {
  await expect(page.getByRole("heading", { name: "Runtime Error" })).toHaveCount(
    0,
  );
  await expect(page.getByText("Application error")).toHaveCount(0);
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  await expect(page.getByText("FORBIDDEN", { exact: true })).toHaveCount(0);
}

test("buyer tours route shows locked upsell and does not overlay", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/tours");
  await expect(page.getByTestId("locked-upsell-tours")).toBeVisible();
  await expect(page.getByTestId("tour-builder")).toHaveCount(0);
  await expectNoRuntimeOverlay(page);
});

test("empty Build My Tour stays usable and does not overlay", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Casey Holt" }).click();
  await expect(page).toHaveURL(/\/agent$/);
  await page.goto("/tours");
  await expect(page.getByTestId("tour-builder")).toBeVisible();

  for (const checkbox of await page.locator('input[name="propertyIds"]').all()) {
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }
  }

  await page.getByTestId("build-my-tour").click();
  await expectNoRuntimeOverlay(page);
  await expect(page.getByTestId("action-notice")).toBeVisible();
  await expect(page.getByTestId("action-notice")).toHaveAttribute(
    "data-notice",
    "select-listing",
  );
  await expect(page.getByTestId("action-notice")).toContainText(
    "Select at least one listing",
  );
  await expect(page.getByTestId("tour-builder")).toBeVisible();
  await expect(page.getByTestId("build-my-tour")).toBeVisible();
});

test("vendor send does not produce a Next runtime overlay", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
  await expect(page.getByTestId("vendor-portal")).toBeVisible();
  await expect(page.getByTestId("vendor-assignment")).toBeVisible();

  await page.getByTestId("vendor-send-message").click();
  await expectNoRuntimeOverlay(page);
  await expect(page.getByTestId("action-notice")).toHaveAttribute(
    "data-notice",
    "empty-message",
  );
  await expect(page.getByTestId("vendor-portal")).toBeVisible();

  await page.getByTestId("vendor-message-body").fill("Report is on the way.");
  await page.getByTestId("vendor-send-message").click();
  await expectNoRuntimeOverlay(page);
  await expect(page.getByTestId("action-notice")).toHaveAttribute(
    "data-notice",
    "sent",
  );
  await expect(page.getByTestId("vendor-assignment")).toBeVisible();
  await expect(page.getByText("Report is on the way.")).toBeVisible();
});

test("buyer vault grant is behind the locked upsell gate", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/vault");
  await expect(page.getByTestId("locked-upsell-vault")).toBeVisible();
  await expect(page.getByTestId("document-vault")).toHaveCount(0);
  await expectNoRuntimeOverlay(page);
});

test("vendor vault stays scoped to the assigned file", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
  await page.goto("/vault");
  await expect(page.getByTestId("document-vault")).toBeVisible();
  await expect(page.getByTestId("vault-doc-inspection_report")).toHaveCount(0);
  await expectNoRuntimeOverlay(page);
});
