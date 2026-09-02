import { expect, type Page, test } from "@playwright/test";

async function expectNoRuntimeOverlay(page: Page) {
  await expect(page.getByRole("heading", { name: "Runtime Error" })).toHaveCount(
    0,
  );
  await expect(page.getByText("Application error")).toHaveCount(0);
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  await expect(page.getByText("FORBIDDEN", { exact: true })).toHaveCount(0);
}

/** Party → scope → expiry are pre-selected; walk to Review and confirm. */
async function stepThroughGrantSheet(page: Page) {
  const sheet = page.getByTestId("grant-sheet");
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "Continue" }).click();
  await sheet.getByRole("button", { name: "Continue" }).click();
  await sheet.getByRole("button", { name: "Continue" }).click();
  await sheet.getByTestId("grant-confirm").click();
}

test("empty Build My Tour stays usable and does not overlay", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
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

test("vault grant appears without a manual reload", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/vault");
  await expect(page.getByTestId("document-vault")).toBeVisible();
  await expect(page.getByText("Granted to lender")).toHaveCount(0);

  await page
    .getByTestId("vault-doc-preapproval")
    .getByRole("button", { name: "Grant to Jordan Hale" })
    .click();
  await stepThroughGrantSheet(page);
  await expect(page.getByText("Granted to lender")).toBeVisible();
  await expectNoRuntimeOverlay(page);
  await expect(page).toHaveURL(/\/vault/);
});

test("vendor vault does not show another buyer's access log", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/vault");
  await page
    .getByTestId("vault-doc-preapproval")
    .getByRole("button", { name: "Grant to Jordan Hale" })
    .click();
  await stepThroughGrantSheet(page);
  await expect(page.getByText("Granted to lender")).toBeVisible();

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
  await page.goto("/vault");
  await expect(page.getByTestId("document-vault")).toBeVisible();
  await expect(page.getByTestId("vault-doc-preapproval")).toBeVisible();
  await expect(page.getByTestId("vault-doc-inspection_report")).toHaveCount(0);
  await expect(page.getByTestId("document-audit")).not.toContainText(
    "seed-doc-closing-disclosure",
  );
  await expect(page.getByTestId("document-audit")).not.toContainText(
    "clerk_buyer_h",
  );
  await expect(page.getByText("Grant to Jordan Hale")).toHaveCount(0);
});
