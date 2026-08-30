import { expect, test } from "@playwright/test";

test("closed buyer sees the four hub surfaces", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Indira Shah" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/homeownership/seed:buyer-h");
  await expect(page.getByTestId("homeownership-hub")).toBeVisible();
  await expect(page.getByTestId("hub-maintenance")).toBeVisible();
  await expect(page.getByText("Replace HVAC filter")).toBeVisible();
  await expect(page.getByTestId("hub-warranties")).toBeVisible();
  await expect(page.getByText("HVAC manufacturer warranty")).toBeVisible();
  await expect(page.getByTestId("hub-values")).toBeVisible();
  await expect(page.getByTestId("hub-figure-issuedClose")).toContainText(
    "$405,000.00",
  );
  await expect(page.getByTestId("hub-figure-issuedClose")).toContainText(
    "title_issued",
  );
  await expect(page.getByTestId("hub-figure-estimatedMarket")).toContainText(
    "ESTIMATE",
  );
  await expect(page.getByTestId("hub-figure-estimatedMarket")).toContainText(
    "ai_estimate",
  );
  await expect(page.getByTestId("hub-figure-taxAssessed")).toHaveText("None");
  await expect(page.getByTestId("hub-figure-taxAssessed")).not.toContainText(
    "$0.00",
  );
  await expect(page.getByTestId("hub-vendors")).toBeVisible();
  await expect(page.getByText("Compensation: none")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay" })).toHaveCount(0);
  await expect(page.getByText("extractedSummary")).toHaveCount(0);
});

test("other buyer, vendor, and unauthenticated callers are denied", async ({
  page,
}) => {
  await page.goto("/homeownership/seed:buyer-h");
  await expect(page.getByTestId("homeownership-hub")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("homeownership-hub")).toHaveCount(0);
  await page.goto("/homeownership/seed:buyer-h");
  await expect(page.getByTestId("homeownership-hub-denied")).toBeVisible();
  await expect(page.getByTestId("homeownership-hub")).toHaveCount(0);

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await page.goto("/homeownership/seed:buyer-h");
  await expect(page.getByTestId("homeownership-hub-denied")).toBeVisible();

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vault$/);
  await page.goto("/homeownership/seed:buyer-h");
  await expect(page.getByTestId("homeownership-hub-denied")).toBeVisible();
  await expect(page.getByTestId("homeownership-hub")).toHaveCount(0);
});

test("a non-closed transaction does not expose the hub", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await page.goto("/homeownership/seed:buyer-a");
  await expect(page.getByTestId("homeownership-hub-denied")).toBeVisible();
  await expect(page.getByTestId("homeownership-hub")).toHaveCount(0);
  await expect(page.getByText("Replace HVAC filter")).toHaveCount(0);
});

test("retained hub documents stay grant-gated on open", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Indira Shah" }).click();
  await page.goto("/homeownership/seed:buyer-h");
  await page
    .getByTestId("hub-doc-closing_disclosure")
    .getByRole("link", { name: "Open" })
    .click();
  await expect(page.getByTestId("document-open-closing_disclosure")).toBeVisible();
  await expect(page.getByText("Title issued a $405,000")).toBeVisible();

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await page.goto("/documents/seed-doc-closing-disclosure");
  await expect(page.getByTestId("document-denied")).toBeVisible();
  await expect(page.getByText("Title issued a $405,000")).toHaveCount(0);

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await page.goto("/documents/seed-doc-closing-disclosure");
  await expect(page.getByTestId("document-denied")).toBeVisible();
});

test("vendor re-engage stays none and flags stay off", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Indira Shah" }).click();
  await page.goto("/homeownership/seed:buyer-h");
  await page
    .getByTestId("hub-vendor-seed-vendor-hvac")
    .getByRole("button", { name: "Re-engage" })
    .click();
  await expect(page).toHaveURL(/\/homeownership\/seed:buyer-h$/);
  await expect(
    page.getByTestId("hub-vendor-seed-vendor-hvac").getByRole("button", {
      name: "Re-engaged",
    }),
  ).toBeVisible();
  await expect(page.getByText("Compensation: none")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay" })).toHaveCount(0);

  await page.goto("/");
  await expect(page.getByText("FLAG_MLS")).toBeVisible();
  await expect(page.getByText("FLAG_VENDOR_COMP")).toBeVisible();
  await expect(page.getByText("FLAG_ESIGN")).toBeVisible();
  await expect(page.getByText("FLAG_IDV")).toBeVisible();
  await expect(page.getByText("off").first()).toBeVisible();
});
