import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function signInDemoBuyerCoach(page: import("@playwright/test").Page) {
  await page.goto("/demo/enter/buyer-coach");
  await expect(page).toHaveURL(/\/coach$/, { timeout: 30_000 });
}

test("demo isolation — own file visible, other transaction denied", async ({
  page,
}) => {
  await signInDemoBuyerCoach(page);
  await expect(page.getByTestId("coach-ten-second")).toContainText(
    "814 Maple Ave",
  );
  await expect(page.getByTestId("demo-shell-badge")).toBeVisible();

  await page.goto("/transactions/seed:buyer-b");
  await expect(
    page.getByText("You cannot open this transaction."),
  ).toBeVisible();
  await expect(page.getByText("Blair Chen")).toHaveCount(0);
});
