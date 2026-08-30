import { expect, test } from "@playwright/test";

test("buyer login shows own transaction and denies another by URL", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("ten-second-where")).toHaveText("Inspection");
  await expect(page.getByTestId("ten-second-done")).toContainText(
    "Sign purchase agreement",
  );
  await expect(page.getByTestId("ten-second-done")).toContainText(
    "Submit earnest money",
  );
  await expect(page.getByTestId("ten-second-next")).toContainText(
    "Schedule inspection",
  );
  await expect(page.getByTestId("ten-second-waiting")).toContainText("agent");
  await expect(page.getByTestId("ten-second-owe")).toContainText("$450.00");
  await expect(page.getByTestId("journey-stage-inspection")).toHaveAttribute(
    "data-state",
    "current",
  );
  await expect(page.getByTestId("stage-blocked")).toContainText(
    "Schedule inspection",
  );
  await expect(page.getByText("Alex Rivera")).toBeVisible();
  await expect(page.getByText("Blair Chen")).toHaveCount(0);

  await page.goto("/transactions/seed:buyer-b");
  await expect(
    page.getByText("You cannot open this transaction."),
  ).toBeVisible();
  await expect(page.getByText("Blair Chen")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Showings" })).toHaveCount(0);
});

test("a second seeded buyer sees a distinct file", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page.getByRole("heading", { name: "Showings" })).toBeVisible();
  await expect(page.getByText("Blair Chen")).toBeVisible();
  await expect(page.getByText("Alex Rivera")).toHaveCount(0);

  await page.goto("/transactions/seed:buyer-a");
  await expect(
    page.getByText("You cannot open this transaction."),
  ).toBeVisible();
});
