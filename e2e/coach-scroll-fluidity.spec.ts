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
  tolerance = 10,
) {
  const deadline = Date.now() + (expectedY >= 300 ? 2500 : 1500);
  let lastY = 0;
  while (Date.now() < deadline) {
    lastY = await page.evaluate(() => window.scrollY);
    if (Math.abs(lastY - expectedY) <= tolerance) {
      return;
    }
    await page.waitForTimeout(50);
  }
  expect(Math.abs(lastY - expectedY)).toBeLessThanOrEqual(tolerance);
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
  await expectScrollStableNear(page, 0, 10);
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
    await expectScrollStableNear(page, savedY, 10);
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
    await expectScrollStableNear(page, savedY, 10);
  });
}

test("coach @375 — leaving from top restores zero on return", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await scrollCoachTo(page, 387);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollY === 0);
  await page.waitForFunction(() => {
    if (window.scrollY === 0) {
      return true;
    }
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key !== null && key.endsWith(":/coach")) {
        return sessionStorage.getItem(key) === "0";
      }
    }
    return false;
  });
  const storedAtTop = await page.evaluate(() => {
    const epoch =
      sessionStorage.getItem("realtyrise.coach.scrollY.epoch") ?? "0";
    return sessionStorage.getItem(
      `realtyrise.coach.scrollY.v1:${epoch}:/coach`,
    );
  });
  expect(storedAtTop).toBe("0");
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
  await expectScrollStableNear(page, 0, 10);
});

test("transactions @375 — deep scroll survives Search tab back forward back", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await page.getByTestId("ten-second-next").getByRole("link").click();
  await page.waitForURL(/\/transactions\/seed:buyer-a/);
  const savedY = await page.evaluate(() => {
    const target = Math.min(
      1095,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    window.scrollTo(0, target);
    return window.scrollY;
  });
  expect(savedY).toBeGreaterThan(400);
  await page
    .getByTestId("app-tab-bar")
    .getByRole("link", { name: "Search" })
    .click();
  await page.waitForURL(/\/search/);
  await page.goBack();
  await page.waitForURL(/\/transactions\/seed:buyer-a/);
  await page.goForward();
  await page.waitForURL(/\/search/);
  await page.goBack();
  await page.waitForURL(/\/transactions\/seed:buyer-a/);
  await expectScrollStableNear(page, savedY, 10);
});

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

test("coach @375 — non-Coach tab opens at scroll top", async ({ page }) => {
  await signInAlexWithFile(page);
  await scrollCoachTo(page, 387);
  const tabBar = page.getByTestId("app-tab-bar");
  await tabBar.getByRole("link", { name: "Search" }).evaluate((anchor) => {
    (anchor as HTMLAnchorElement).click();
  });
  await page.waitForURL(/\/search/);
  await expectScrollStableNear(page, 0, 10);
  await tabBar.getByRole("link", { name: "Tours" }).evaluate((anchor) => {
    (anchor as HTMLAnchorElement).click();
  });
  await page.waitForURL(/\/tours/);
  await expectScrollStableNear(page, 0, 10);
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
