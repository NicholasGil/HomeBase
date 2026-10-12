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
  const fileDepth = await page.evaluate(() => window.scrollY);

  await page.goto("/test-login");
  await page
    .getByTestId("sign-in-alex-discovery-empty")
    .getByRole("button")
    .click();
  await expect(page).toHaveURL(/\/coach$/);
  await expectCoachNearTop(page);
  const afterSwitch = await page.evaluate(() => {
    const epoch =
      sessionStorage.getItem("realtyrise.coach.scrollY.epoch") ?? "0";
    const key = `realtyrise.coach.scrollY.v1:${epoch}:/coach`;
    const stored = sessionStorage.getItem(key);
    return {
      scrollY: window.scrollY,
      stored,
      epoch,
    };
  });
  expect(afterSwitch.scrollY).toBeLessThanOrEqual(10);
  expect(afterSwitch.stored === "0" || afterSwitch.stored === null).toBe(true);
  expect(Math.abs(afterSwitch.scrollY - fileDepth)).toBeGreaterThan(100);

  await page.goBack();
  await page.waitForURL(/\/test-login$/);
  await page.goBack();
  await page.waitForURL(/\/coach$/);
  await page.waitForFunction(() => window.scrollY <= 10);
});

test("same-tab test-login persona switch does not reuse prior epoch coach depth", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.evaluate(() => window.scrollTo(0, 350));
  await page.waitForFunction(() => window.scrollY >= 300);
  const firstEpoch = await page.evaluate(
    () => sessionStorage.getItem("realtyrise.coach.scrollY.epoch"),
  );

  await page.goto("/test-login");
  await page
    .getByTestId("sign-in-alex-discovery-empty")
    .getByRole("button")
    .click();
  await expect(page).toHaveURL(/\/coach$/);
  const second = await page.evaluate(() => {
    const epoch = sessionStorage.getItem("realtyrise.coach.scrollY.epoch");
    const key = `realtyrise.coach.scrollY.v1:${epoch ?? "0"}:/coach`;
    return {
      epoch,
      stored: sessionStorage.getItem(key),
      scrollY: window.scrollY,
    };
  });
  expect(second.epoch).not.toBe(firstEpoch);
  expect(second.scrollY).toBeLessThanOrEqual(10);
  expect(second.stored === "0" || second.stored === null).toBe(true);
});
