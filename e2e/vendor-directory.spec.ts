import { expect, test } from "@playwright/test";

test("inspection stage shows inspectors with compare and request-appointment", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("vendor-directory")).toBeVisible();
  await expect(page.getByTestId("vendor-compare")).toBeVisible();
  await expect(page.getByTestId("vendor-card-seed-vendor-inspector-riley")).toBeVisible();
  await expect(page.getByTestId("vendor-card-seed-vendor-inspector-sam")).toBeVisible();
  await expect(page.getByText("Compensation: none").first()).toBeVisible();
  await expect(page.getByText("referral fee")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pay" })).toHaveCount(0);

  await page
    .getByTestId("vendor-card-seed-vendor-inspector-riley")
    .getByRole("button", { name: "Request appointment" })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page
      .getByTestId("vendor-card-seed-vendor-inspector-riley")
      .getByRole("button", { name: "Appointment requested" }),
  ).toBeVisible();
});

test("showings stage does not surface inspectors", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page.getByTestId("vendor-directory")).toBeVisible();
  await expect(page.getByTestId("vendor-directory-empty")).toBeVisible();
  await expect(page.getByTestId("vendor-compare")).toHaveCount(0);
  await expect(page.getByText("Riley Brooks")).toHaveCount(0);
});

test("vendor portal is one assigned file and expires", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vault$/);
  await page.goto("/vendor");
  await expect(page.getByTestId("vendor-portal")).toBeVisible();
  await expect(page.getByTestId("vendor-assignment")).toBeVisible();
  await expect(page.getByTestId("vendor-assignment-file")).toContainText(
    "seed:buyer-a",
  );
  await expect(page.getByTestId("vendor-assignment-stage")).toContainText(
    "inspection",
  );
  await expect(page.getByText("Blair Chen")).toHaveCount(0);
  await expect(page.getByText("seed:buyer-b")).toHaveCount(0);
  await expect(page.getByText("Compensation: none")).toBeVisible();

  await page.getByRole("button", { name: "End access now" }).click();
  await expect(page.getByTestId("vendor-access-expired")).toBeVisible();
  await expect(page.getByTestId("vendor-assignment")).toHaveCount(0);
});

test("feature flags stay off", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("FLAG_VENDOR_COMP")).toBeVisible();
  await expect(page.getByText("Vendor compensation", { exact: true })).toBeVisible();
  await expect(page.getByText("off").first()).toBeVisible();
});

test("buyer cannot open the vendor portal", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/vendor");
  await expect(page.getByTestId("vendor-portal-denied")).toBeVisible();
  await expect(page.getByTestId("vendor-assignment")).toHaveCount(0);
});
