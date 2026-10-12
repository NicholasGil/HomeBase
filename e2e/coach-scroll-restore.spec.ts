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

  const tabBar = page.getByTestId("app-tab-bar");
  await page.goto("/search");
  await page.waitForURL(/\/search/);
  await page.goto("/coach");
  await page.waitForURL(/\/coach$/);

  const samples: number[] = [];
  for (let i = 0; i < 12; i += 1) {
    samples.push(await page.evaluate(() => window.scrollY));
    await page.waitForTimeout(16);
  }
  expect(samples.filter((y) => y === 0)).toHaveLength(0);
  expect(samples.at(-1)).toBeGreaterThanOrEqual(300);
});
