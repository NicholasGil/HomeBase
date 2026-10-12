import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function scrollCoachDeep(page: import("@playwright/test").Page, y = 380) {
  await page.evaluate((target) => {
    const max = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    window.scrollTo(0, Math.min(target, max));
  }, y);
  await page.waitForFunction(() => window.scrollY >= 120);
}

test("same-tab demo persona switch does not carry file coach scroll depth", async ({
  page,
}) => {
  await page.goto("/demo/enter/buyer-coach");
  await expect(page).toHaveURL(/\/coach$/);
  await page.getByTestId("coach-ten-second").waitFor();
  await scrollCoachDeep(page, 380);
  const before = await page.evaluate(() => ({
    scrollY: window.scrollY,
    epoch: sessionStorage.getItem("realtyrise.coach.scrollY.epoch"),
  }));
  expect(before.scrollY).toBeGreaterThan(120);

  await page.goto("/demo/enter/buyer-discovery");
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();

  const after = await page.evaluate(() => {
    const epoch =
      sessionStorage.getItem("realtyrise.coach.scrollY.epoch") ?? "0";
    const key = `realtyrise.coach.scrollY.v1:${epoch}:/coach`;
    const hadResetCookie = document.cookie
      .split(";")
      .some((part) => part.trim().startsWith("hb_demo_clear_coach_scroll="));
    return {
      scrollY: window.scrollY,
      epoch,
      stored: sessionStorage.getItem(key),
      hadResetCookie,
    };
  });

  expect(after.epoch).not.toBe(before.epoch);
  expect(after.scrollY).toBeLessThanOrEqual(10);
  expect(after.stored === "0" || after.stored === null).toBe(true);
  expect(Math.abs(after.scrollY - before.scrollY)).toBeGreaterThan(100);
});
