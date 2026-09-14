import { expect, test } from "@playwright/test";

import { SEED_TOUR_PROPERTY_IDS } from "../convex/seedPlan";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function signInAsVendor(page: import("@playwright/test").Page) {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
}

test("PR #26 design proof — listing URL denied @375", async ({ page }) => {
  await signInAsVendor(page);
  await page.goto(`/listings/${SEED_TOUR_PROPERTY_IDS.madison}`);
  const denied = page.getByTestId("listing-denied");
  await expect(denied).toBeVisible();
  await expect(denied).toContainText("You cannot open this listing.");
  await expect(page.getByTestId("listing-detail")).toHaveCount(0);
  await expect(page.getByText("88 Legacy Dr")).toHaveCount(0);
  await page.screenshot({
    path: "proof/pr26/listing-url-denied-375.png",
    fullPage: true,
  });
});

test("PR #26 design proof — transaction denied @375", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/transactions/seed:buyer-b");
  await expect(
    page.getByText("You cannot open this transaction."),
  ).toBeVisible();
  await expect(page.getByText("Blair Chen")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Showings" })).toHaveCount(0);
  await page.screenshot({
    path: "proof/pr26/transaction-denied-375.png",
    fullPage: true,
  });
});

test("PR #26 design proof — search denied chrome @375", async ({ page }) => {
  await signInAsVendor(page);
  await page.goto("/search");
  const denied = page.getByTestId("search-denied");
  await expect(denied).toBeVisible();
  await denied.screenshot({
    path: "proof/pr26/search-denied-375.png",
  });
});
