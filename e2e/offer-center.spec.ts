import { expect, test } from "@playwright/test";

test("offer draft is blocked by the licensee gate", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("offer-center")).toBeVisible();
  await expect(page.getByTestId("scenario-stronger")).toBeVisible();
  await expect(page.getByTestId("scenario-balanced")).toBeVisible();
  await expect(page.getByTestId("scenario-value")).toBeVisible();
  await expect(page.getByTestId("stronger-tradeoffs")).toBeVisible();
  await expect(page.getByTestId("balanced-tradeoffs")).toBeVisible();
  await expect(page.getByTestId("value-tradeoffs")).toBeVisible();
  await expect(page.getByTestId("offer-market")).toContainText("sample data");
  await expect(page.getByTestId("licensee-gate")).toHaveAttribute(
    "data-gate",
    "LICENSEE_REVIEW_REQUIRED",
  );

  await expect(page.getByTestId("submit-offer")).toHaveCount(0);
  await expect(page.getByTestId("submit-offer-gated")).toContainText(
    "FLAG_ESIGN",
  );
  await expect(page.getByTestId("licensee-gate")).toHaveAttribute(
    "data-gate",
    "LICENSEE_REVIEW_REQUIRED",
  );
  await expect(page.getByTestId("licensee-gate")).toContainText("licensee");
  await expect(page.getByTestId("offer-status")).toContainText("No draft yet");
});

test("another buyer cannot submit Blair's draft", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page.getByTestId("offer-center")).toBeVisible();

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/offers");
  await expect(page.getByText("Signed in as Alex Rivera")).toBeVisible();
  await expect(page.getByTestId("offer-center")).toBeVisible();
  await expect(page.getByTestId("offer-status")).toContainText("draft");
  await expect(page.getByTestId("licensee-gate")).toHaveAttribute(
    "data-gate",
    "LICENSEE_REVIEW_REQUIRED",
  );
});
