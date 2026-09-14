import { expect, test } from "@playwright/test";

import { SEED_TOUR_PROPERTY_IDS } from "../convex/seedPlan";

test("listing detail opens from agent search results", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Casey Holt" }).click();
  await expect(page).toHaveURL(/\/agent$/);
  await page.goto("/search?q=Madison");
  await expect(page.getByTestId("property-search")).toBeVisible();
  const card = page.getByTestId(
    `search-result-${SEED_TOUR_PROPERTY_IDS.madison}`,
  );
  await expect(card).toBeVisible();
  await card.getByRole("link", { name: /88 Legacy Dr/ }).click();
  await expect(page).toHaveURL(
    new RegExp(`/listings/${SEED_TOUR_PROPERTY_IDS.madison}`),
  );
  await expect(page.getByTestId("listing-detail")).toBeVisible();
});

test("buyer search route shows locked empty state instead of results", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/search?q=Birmingham");
  await expect(page.getByTestId("locked-upsell-search")).toBeVisible();
  await expect(page.getByTestId("search-empty")).toHaveCount(0);
});

test("buyer vault route is locked", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/vault");
  await expect(page.getByTestId("locked-upsell-vault")).toBeVisible();
  await expect(page.getByTestId("vault-doc-preapproval")).toHaveCount(0);
});

test("agent client and priority rows open the transaction", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Casey Holt" }).click();
  await expect(page).toHaveURL(/\/agent$/);
  await page.getByTestId("client-alex-rivera").click();
  await expect(page).toHaveURL(/\/transactions\/seed:buyer-a$/);
  await expect(page.getByTestId("ten-second-where")).toHaveText("Inspection");
  await page.goto("/agent");
  await page.getByTestId("priority-1").click();
  await expect(page).toHaveURL(/\/transactions\/seed:buyer-/);
  await expect(page.getByTestId("ten-second-where")).toBeVisible();
});
