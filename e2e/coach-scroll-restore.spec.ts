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
}

test("coach file session @375 — Due today drill then browser back keeps scroll 1500ms (S2)", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await expect(page.getByTestId("coach-ten-second")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 387));
  await page.waitForFunction(() => window.scrollY >= 300);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  expect(scrollBefore).toBeGreaterThanOrEqual(300);

  await page.getByTestId("ten-second-next").getByRole("link").click();
  await page.waitForURL(/\/transactions\//);
  await page.goBack();
  await page.waitForURL(/\/coach$/);
  await page.waitForFunction(() => window.scrollY >= 300);

  await page.getByTestId("ten-second-owe").getByRole("link").click();
  await page.waitForURL(/\/transactions\//);
  await expect(page.getByTestId("ten-second-hero")).toBeVisible();

  await page.goBack();
  await page.waitForURL(/\/coach$/, { timeout: 15_000 });

  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    const y = await page.evaluate(() => window.scrollY);
    expect(y).toBeGreaterThanOrEqual(300);
    await page.waitForTimeout(50);
  }
});

test("coach file session @375 — scroll survives browser back for 1s", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await page.evaluate(() => window.scrollTo(0, 372));
  await page.waitForTimeout(150);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  expect(scrollBefore).toBeGreaterThanOrEqual(300);

  const txHref = await page.evaluate(() => {
    const link = document.querySelector('a[href^="/transactions/"]');
    return link?.getAttribute("href") ?? null;
  });
  expect(txHref).not.toBeNull();
  await page.goto(txHref!);
  await page.waitForURL(/\/transactions\//);
  await page.goBack();
  await page.waitForURL(/\/coach$/);
  await page.waitForFunction(() => window.scrollY >= 300, undefined, {
    timeout: 5000,
  });

  for (let i = 0; i < 10; i += 1) {
    const y = await page.evaluate(() => window.scrollY);
    expect(y).toBeGreaterThanOrEqual(300);
    await page.waitForTimeout(100);
  }
});

test("coach file session @375 — tab return avoids a zero scroll frame", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await page.evaluate(() => window.scrollTo(0, 372));
  await page.waitForTimeout(100);

  await page
    .getByTestId("app-tab-bar")
    .getByRole("link", { name: "Search" })
    .click();
  await page.waitForURL(/\/search/);
  await page
    .getByTestId("app-tab-bar")
    .getByRole("link", { name: "Coach", exact: true })
    .click();
  await page.waitForURL(/\/coach$/);
  await page.waitForFunction(() => window.scrollY >= 300, undefined, {
    timeout: 5000,
  });
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThanOrEqual(300);
});

test("coach — leaving /coach resets history.scrollRestoration to auto", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await page
    .getByTestId("app-tab-bar")
    .getByRole("link", { name: "Search" })
    .click();
  await page.waitForURL(/\/search/);
  await expect
    .poll(() => page.evaluate(() => history.scrollRestoration))
    .toBe("auto");
});
