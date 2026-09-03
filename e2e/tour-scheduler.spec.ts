import { expect, test } from "@playwright/test";

import { SEED_TOUR, SEED_TOUR_PROPERTY_IDS } from "../convex/seedPlan";

test("tour build then remove stop 2 re-optimizes the remainder", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/tours");
  await expect(page.getByTestId("tour-builder")).toBeVisible();

  for (const id of Object.values(SEED_TOUR_PROPERTY_IDS)) {
    await page.getByTestId(`select-${id}`).check();
  }
  await page.getByTestId("build-my-tour").click();
  await expect(page).toHaveURL(/\/tours$/);
  await expect(page.getByTestId("tour-itinerary")).toBeVisible();
  await expect(page.getByTestId("tour-map")).toBeVisible();
  await expect(page.getByTestId("departure-notice")).toContainText("notified");
  await expect(page.getByTestId("tour-stop-1")).toBeVisible();
  await expect(page.getByTestId("tour-stop-2")).toBeVisible();
  await expect(page.getByTestId("tour-stop-3")).toBeVisible();
  await expect(page.getByTestId("tour-stop-4")).toBeVisible();
  await expect(page.getByTestId("window-ok-1")).toHaveAttribute(
    "data-window-violated",
    "false",
  );
  await expect(page.getByTestId("window-ok-2")).toHaveAttribute(
    "data-window-violated",
    "false",
  );

  const removedPropertyId = await page
    .getByTestId("tour-stop-2")
    .getAttribute("data-property-id");
  expect(removedPropertyId).toBeTruthy();

  await page.getByTestId("remove-stop-2").click();
  await expect(page.getByTestId("tour-itinerary")).toBeVisible();
  await expect(page.getByTestId("tour-stop-4")).toHaveCount(0);
  await expect(page.getByTestId("tour-stop-1")).toBeVisible();
  await expect(page.getByTestId("tour-stop-2")).toBeVisible();
  await expect(page.getByTestId("tour-stop-3")).toBeVisible();
  await expect(
    page.locator(`[data-property-id="${removedPropertyId}"]`),
  ).toHaveCount(0);
  await expect(page.getByTestId("window-ok-1")).toHaveAttribute(
    "data-window-violated",
    "false",
  );
  expect(SEED_TOUR.properties).toHaveLength(4);

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Alex Rivera")).toBeVisible();
  await page.goto("/tours");
  await expect(page.getByText("Signed in as Alex Rivera")).toBeVisible();
  await expect(page.getByTestId("tour-builder")).toBeVisible();
  await expect(page.getByTestId("tour-itinerary")).toHaveCount(0);
});

test("another buyer cannot see the built tour", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/tours");
  await expect(page.getByText("Signed in as Alex Rivera")).toBeVisible();
  await expect(page.getByTestId("tour-builder")).toBeVisible();
  await expect(page.getByTestId("tour-itinerary")).toHaveCount(0);
});
