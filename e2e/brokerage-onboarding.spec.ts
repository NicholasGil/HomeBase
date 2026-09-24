import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

test("fixture onboarding agent creates empty brokerage book", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByTestId("sign-in-onboarding-agent").click();
  await expect(page).toHaveURL(/\/brokerage\/onboarding$/);
  await expect(page.getByTestId("brokerage-onboarding")).toBeVisible();
  await page.getByTestId("brokerage-name-input").fill("Harborline Realty");
  await page.getByTestId("brokerage-create-submit").click();
  await expect(page).toHaveURL(/\/agent$/);
  await expect(page.getByTestId("command-center-empty")).toBeVisible();
  await expect(page.getByTestId("command-center-copy-invite")).toBeVisible();
});

test("Alex discovery-empty coach still loads", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByTestId("sign-in-alex-discovery-empty").click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("coach-home")).toBeVisible();
});
