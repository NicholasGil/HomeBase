import { expect, test } from "@playwright/test";

import { SEED_TOUR_PROPERTY_IDS } from "../convex/seedPlan";

test("listing card opens a sample house page", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
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
  await expect(page.getByRole("heading", { name: "88 Legacy Dr" })).toBeVisible();
  await expect(page.getByText("Madison, AL")).toBeVisible();
  await expect(
    page.getByTestId(`search-save-${SEED_TOUR_PROPERTY_IDS.madison}`),
  ).toBeVisible();
});

test("search stays empty for a city with no sample homes", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/search?q=Birmingham");
  await expect(page.getByTestId("search-empty")).toBeVisible();
  await expect(page.getByTestId("search-empty")).toContainText("Birmingham");
  await expect(page.locator("[data-testid^='search-result-']")).toHaveCount(0);
  await expect(page.getByText("Huntsville, AL")).toHaveCount(0);
  await expect(page.getByText("Athens, AL")).toHaveCount(0);
});

test("vault document card body opens the document", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/vault");
  await expect(page.getByTestId("vault-doc-preapproval")).toBeVisible();
  await page.getByTestId("vault-doc-open-preapproval").click();
  await expect(page.getByTestId("document-open-preapproval")).toBeVisible();
  await expect(page.getByTestId("document-back")).toBeVisible();
  await page.getByTestId("document-back").click();
  await expect(page).toHaveURL(/\/vault$/);
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

test("dashboard next, due and stage chips open the buyer's transaction", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByTestId("journey-tracker").locator('a[href="#assumptions-panel"]'),
  ).toHaveCount(0);
  await expect(page.getByTestId("journey-tracker").locator("a")).toHaveCount(
    13,
  );

  await page.getByTestId("ten-second-next").getByRole("link").click();
  await expect(page).toHaveURL(/\/transactions\/seed:buyer-a$/);
  await expect(page.getByTestId("ten-second-where")).toHaveText("Inspection");
  await expect(page.getByText("You cannot open this transaction.")).toHaveCount(
    0,
  );

  await page.goto("/dashboard");
  await page.getByTestId("ten-second-owe").getByRole("link").click();
  await expect(page).toHaveURL(/\/transactions\/seed:buyer-a$/);

  await page.goto("/dashboard");
  await page
    .getByTestId("journey-stage-inspection")
    .getByRole("link", { name: /Inspection/ })
    .click();
  await expect(page).toHaveURL(/\/transactions\/seed:buyer-a$/);
  await expect(
    page.getByTestId("journey-stage-inspection").locator("a"),
  ).toHaveCount(0);
});
