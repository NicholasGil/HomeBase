import { expect, test } from "../fixtures";

import { scrollCoachDeep } from "../helpers/coach-scroll-deep";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

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

  const resetCookieOnEnter = page.waitForResponse(async (response) => {
    if (!response.url().includes("/demo/enter/buyer-discovery")) {
      return false;
    }
    const setCookies = await response.headerValues("set-cookie");
    return setCookies.some((value) =>
      value.includes("hb_demo_clear_coach_scroll="),
    );
  });
  await page.goto("/demo/enter/buyer-discovery");
  await resetCookieOnEnter;

  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  await page.waitForFunction(() => window.scrollY <= 10, { timeout: 200 });
  await page.waitForTimeout(1300);
  await page.waitForFunction(() => window.scrollY <= 10);

  const after = await page.evaluate(() => {
    const epoch =
      sessionStorage.getItem("realtyrise.coach.scrollY.epoch") ?? "0";
    const key = `realtyrise.coach.scrollY.v1:${epoch}:/coach`;
    const resetCookiePresent = document.cookie
      .split(";")
      .some((part) => part.trim().startsWith("hb_demo_clear_coach_scroll="));
    return {
      scrollY: window.scrollY,
      epoch,
      stored: sessionStorage.getItem(key),
      resetCookiePresent,
    };
  });

  expect(after.epoch).not.toBe(before.epoch);
  expect(after.scrollY).toBeLessThanOrEqual(10);
  expect(after.stored === "0" || after.stored === null).toBe(true);
  expect(after.resetCookiePresent).toBe(false);
  expect(Math.abs(after.scrollY - before.scrollY)).toBeGreaterThan(100);
});
