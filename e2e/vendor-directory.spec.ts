import { expect, test } from "@playwright/test";

test("pipeline route shows locked upsell instead of vendor directory", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("locked-upsell-pipeline")).toBeVisible();
  await expect(page.getByTestId("vendor-directory")).toHaveCount(0);
});

test("coach home surfaces locked OS cards on mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("locked-upsell-rail-summary")).toBeVisible();
  await expect(page.getByTestId("locked-upsell-search")).not.toBeVisible();
  await expect(page.getByTestId("vendor-directory")).toHaveCount(0);
});

test("showings stage pipeline is locked instead of surfacing inspectors", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("locked-upsell-pipeline")).toBeVisible();
  await expect(page.getByTestId("vendor-directory")).toHaveCount(0);
});

test("vendor portal is one assigned file and expires", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
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

test("feature flags stay off", async () => {
  const { DEFAULT_FEATURE_FLAGS } = await import("../src/lib/flags");
  expect(DEFAULT_FEATURE_FLAGS.FLAG_VENDOR_COMP).toBe(false);
});

test("buyer cannot open the vendor portal", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/vendor");
  await expect(page.getByTestId("vendor-portal-denied")).toBeVisible();
  await expect(page.getByTestId("vendor-assignment")).toHaveCount(0);
});
