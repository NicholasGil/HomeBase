import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function expectCoachNearTop(page: import("@playwright/test").Page) {
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  await page.waitForFunction(() => window.scrollY <= 10);
}

test("test-login persona switch clears coach scroll and back does not restore depth", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.getByTestId("coach-ten-second").waitFor();
  await page.evaluate(() => window.scrollTo(0, 365));
  await page.waitForFunction(() => window.scrollY >= 300);

  await page.goto("/test-login");
  await page
    .getByTestId("sign-in-alex-discovery-empty")
    .getByRole("button")
    .click();
  await expect(page).toHaveURL(/\/coach$/);
  await expectCoachNearTop(page);

  await page.goBack();
  await page.waitForURL(/\/test-login$/);
  await page.goBack();
  await page.waitForURL(/\/coach$/);
  await page.waitForFunction(() => window.scrollY <= 10);
});
