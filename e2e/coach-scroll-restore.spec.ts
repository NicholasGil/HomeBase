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
  const savedY = await page.evaluate(() => window.scrollY);
  expect(savedY).toBeGreaterThanOrEqual(300);

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

  const samples: number[] = [];
  for (let i = 0; i < 12; i += 1) {
    samples.push(await page.evaluate(() => window.scrollY));
    await page.waitForTimeout(16);
  }
  expect(samples.filter((y) => y === 0)).toHaveLength(0);
  expect(samples.at(-1)).toBeGreaterThanOrEqual(300);
  for (const y of samples) {
    expect(Math.abs(y - savedY)).toBeLessThanOrEqual(10);
  }
});

test("coach file session @375 — pageshow persisted restores saved scroll within 10px", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await page.evaluate(() => window.scrollTo(0, 372));
  await page.waitForFunction(() => window.scrollY >= 300);
  const target = await page.evaluate(() => {
    const epoch =
      sessionStorage.getItem("realtyrise.coach.scrollY.epoch") ?? "0";
    const key = `realtyrise.coach.scrollY.v1:${epoch}:/coach`;
    const raw = sessionStorage.getItem(key);
    return raw === null ? 0 : Number.parseInt(raw, 10);
  });
  expect(target).toBeGreaterThanOrEqual(300);

  await page.evaluate(() => {
    window.scrollTo(0, 0);
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    );
  });
  await page.waitForFunction(
    (minY) => window.scrollY >= minY - 10,
    target,
    { timeout: 2000 },
  );
});

test("coach — leaving /coach resets history.scrollRestoration to auto", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await page.goto("/search");
  await page.waitForURL(/\/search/);
  await expect
    .poll(() => page.evaluate(() => history.scrollRestoration))
    .toBe("auto");
});
