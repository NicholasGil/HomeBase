import { expect, test } from "@playwright/test";

import { CANONICAL_SEARCH_QUERY } from "../convex/lib/propertySearch";
import {
  SEED_SEARCH_PROPERTY_IDS,
  SEED_TOUR_PROPERTY_IDS,
} from "../convex/seedPlan";

test("canonical search ranks sample listings and feedback changes order", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/search");
  await expect(page.getByTestId("property-search")).toBeVisible();
  await expect(page.getByTestId("search-mls-flag")).toContainText("off");
  await expect(page.getByTestId("search-sample-banner")).toContainText(
    "sample data",
  );
  await expect(page.getByTestId("search-query")).toHaveValue(
    CANONICAL_SEARCH_QUERY,
  );
  await expect(page.getByTestId("search-criteria")).toContainText("4 beds");
  await expect(page.getByTestId("search-criteria")).toContainText("under $450,000");
  await expect(page.getByTestId("search-criteria")).toContainText("some land");
  await expect(page.getByTestId("search-criteria")).toContainText("good garage");
  await expect(page.getByTestId("search-criteria")).toContainText(
    "20 minutes from town",
  );

  const first = page.locator("[data-testid^='search-result-']").first();
  await expect(first).toBeVisible();
  const firstId = await first.getAttribute("data-property-id");
  expect(firstId).toBe(SEED_SEARCH_PROPERTY_IDS.jonesValley);
  await expect(first).toHaveAttribute("data-rank", "1");
  await expect(
    page.getByTestId(`search-reason-${SEED_SEARCH_PROPERTY_IDS.jonesValley}`),
  ).not.toHaveText("");
  await expect(page.getByTestId("search-sample-label").first()).toContainText(
    "sample data",
  );
  await expect(
    page.getByText("900 Licensed Feed Ln"),
  ).toHaveCount(0);

  await page
    .getByTestId(`search-dislike-${SEED_SEARCH_PROPERTY_IDS.jonesValley}`)
    .click();
  await expect(page.getByTestId("property-search")).toBeVisible();
  const after = page.locator("[data-testid^='search-result-']").first();
  await expect(after).toHaveAttribute("data-rank", "1");
  await expect(after).not.toHaveAttribute(
    "data-property-id",
    SEED_SEARCH_PROPERTY_IDS.jonesValley,
  );
  const newFirstId = await after.getAttribute("data-property-id");
  expect(newFirstId).toBeTruthy();
  expect(newFirstId).not.toBe(SEED_SEARCH_PROPERTY_IDS.jonesValley);
});

test("vendor cannot open search", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
  await page.goto("/search");
  await expect(page.getByTestId("search-denied")).toBeVisible();
});

test("vendor cannot open a listing by url", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
  await page.goto(`/listings/${SEED_TOUR_PROPERTY_IDS.madison}`);
  await expect(page.getByTestId("listing-denied")).toBeVisible();
  await expect(page.getByTestId("listing-denied")).toHaveText(
    "You cannot open this listing.",
  );
  await expect(page.getByTestId("listing-detail")).toHaveCount(0);
  await expect(page.getByText("88 Legacy Dr")).toHaveCount(0);
});

test("unauthenticated listing url does not render the house", async ({
  page,
}) => {
  await page.goto(`/listings/${SEED_TOUR_PROPERTY_IDS.madison}`);
  await expect(page.getByTestId("listing-detail")).toHaveCount(0);
  await expect(page.getByText("88 Legacy Dr")).toHaveCount(0);
});

test("feature flags stay off including MLS", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("FLAG_MLS")).toBeVisible();
  await expect(page.getByText("Live MLS / IDX inventory")).toBeVisible();
  await expect(page.getByText("off").first()).toBeVisible();
});
