import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function signInAlexWithFile(page: import("@playwright/test").Page) {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("coach-ten-second")).toBeVisible();
}

async function scrollCoachTo(page: import("@playwright/test").Page, targetY: number) {
  await page.evaluate((y) => window.scrollTo(0, y), targetY);
  await page.waitForTimeout(150);
  const y = await page.evaluate(() => window.scrollY);
  const minY = targetY >= 300 ? 300 : 70;
  expect(y).toBeGreaterThanOrEqual(minY);
  return y;
}

async function expectScrollStableNear(
  page: import("@playwright/test").Page,
  expectedY: number,
  tolerance = 24,
) {
  const deadline = Date.now() + (expectedY >= 300 ? 2500 : 1500);
  while (Date.now() < deadline) {
    const y = await page.evaluate(() => window.scrollY);
    expect(Math.abs(y - expectedY)).toBeLessThanOrEqual(tolerance);
    await page.waitForTimeout(50);
  }
}

async function drillToTransaction(page: import("@playwright/test").Page) {
  await page.getByTestId("ten-second-owe").getByRole("link").click();
  await page.waitForURL(/\/transactions\//);
}

test("coach @375 Y≈387 — ten-second drill lands transaction at top", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await scrollCoachTo(page, 387);
  await page.getByTestId("ten-second-next").getByRole("link").click();
  await page.waitForURL(/\/transactions\//);
  await expectScrollStableNear(page, 0, 16);
});

for (const targetY of [90, 387]) {
  test(`coach @375 Y≈${targetY} — browser back restores scroll`, async ({
    page,
  }) => {
    await signInAlexWithFile(page);
    const savedY = await scrollCoachTo(page, targetY);
    expect(savedY).toBeGreaterThanOrEqual(targetY === 90 ? 70 : 300);
    await drillToTransaction(page);
    await page.goBack();
    await page.waitForURL(/\/coach$/);
    await expectScrollStableNear(page, savedY);
  });

  test(`coach @375 Y≈${targetY} — back forward back restores scroll`, async ({
    page,
  }) => {
    await signInAlexWithFile(page);
    const savedY = await scrollCoachTo(page, targetY);
    await drillToTransaction(page);
    await page.goBack();
    await page.waitForURL(/\/coach$/);
    await page.goForward();
    await page.waitForURL(/\/transactions\//);
    await page.goBack();
    await page.waitForURL(/\/coach$/);
    await expectScrollStableNear(page, savedY);
  });

  test(`coach @375 Y≈${targetY} — reload restores scroll`, async ({ page }) => {
    await signInAlexWithFile(page);
    const savedY = await scrollCoachTo(page, targetY);
    await page.reload();
    await page.waitForURL(/\/coach$/);
    await expectScrollStableNear(page, savedY);
  });

  test(`coach @375 Y≈${targetY} — Coach tab return restores scroll`, async ({
    page,
  }) => {
    await signInAlexWithFile(page);
    const savedY = await scrollCoachTo(page, targetY);
    const tabBar = page.getByTestId("app-tab-bar");
    await tabBar.getByRole("link", { name: "Search" }).evaluate((anchor) => {
      (anchor as HTMLAnchorElement).click();
    });
    await page.waitForURL(/\/search/);
    const coachTab = tabBar.getByRole("link", { name: "Coach", exact: true });
    await coachTab.evaluate((anchor) => {
      (anchor as HTMLAnchorElement).click();
    });
    await page.waitForURL(/\/coach$/);
    await expect(page.getByTestId("coach-ten-second")).toBeVisible();
    await expectScrollStableNear(page, savedY);
  });

  test(`coach @375 Y≈${targetY} — Search then Coach restores scroll`, async ({
    page,
  }) => {
    await signInAlexWithFile(page);
    const savedY = await scrollCoachTo(page, targetY);
    await page
      .getByTestId("app-tab-bar")
      .getByRole("link", { name: "Search" })
      .evaluate((anchor) => {
        (anchor as HTMLAnchorElement).click();
      });
    await page.waitForURL(/\/search/);
    await page.goto("/coach");
    await page.waitForURL(/\/coach$/);
    await expect(page.getByTestId("coach-ten-second")).toBeVisible();
    await expectScrollStableNear(page, savedY);
  });
}

test("transactions @375 — native back forward preserves scroll within 10px", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await page.getByTestId("ten-second-next").getByRole("link").click();
  await page.waitForURL(/\/transactions\/seed:buyer-a/);
  const savedY = await scrollCoachTo(page, 445);
  await page.goBack();
  await page.waitForURL(/\/coach$/);
  await page.goForward();
  await page.waitForURL(/\/transactions\/seed:buyer-a/);
  const after = await page.evaluate(() => window.scrollY);
  expect(Math.abs(after - savedY)).toBeLessThanOrEqual(10);
});

test("pricing @375 — native back forward preserves scroll within 10px", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await page.getByTestId("coach-pricing-link").click();
  await page.waitForURL(/\/pricing/);
  const savedY = await scrollCoachTo(page, 336);
  await page.goBack();
  await page.waitForURL(/\/coach$/);
  await page.goForward();
  await page.waitForURL(/\/pricing/);
  const after = await page.evaluate(() => window.scrollY);
  expect(Math.abs(after - savedY)).toBeLessThanOrEqual(10);
});
