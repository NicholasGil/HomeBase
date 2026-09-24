import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
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

test("joining Lookout via invite shows org client roster", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByTestId("sign-in-onboarding-agent-join").click();
  await expect(page).toHaveURL(/\/brokerage\/onboarding$/);
  await expect(page.getByTestId("brokerage-onboarding")).toBeVisible();
  await page.goto("/brokerage/onboarding?mode=join");
  await expect(page.getByTestId("brokerage-onboarding")).toBeVisible();
  const inviteInput = page.getByTestId("brokerage-invite-input");
  if (!(await inviteInput.isVisible())) {
    await page.getByTestId("brokerage-mode-join").click();
  }
  await expect(inviteInput).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("brokerage-invite-input").fill("LOOKOUT1");
  await page.getByTestId("brokerage-join-submit").click();
  await expect(page).toHaveURL(/\/agent$/);
  await expect(page.getByTestId("command-center-empty")).toHaveCount(0);
  await expect(page.getByTestId("command-center-roster")).toBeVisible();
  await expect(page.getByTestId("client-alex-rivera")).toBeVisible();
});

test("Alex discovery-empty coach still loads", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByTestId("sign-in-alex-discovery-empty").click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("coach-home")).toBeVisible();
});
