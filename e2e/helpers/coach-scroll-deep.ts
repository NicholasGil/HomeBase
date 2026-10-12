import type { Page } from "@playwright/test";

/** Wait until the coach main column can scroll at least `minRange` px. */
export async function waitCoachScrollRange(
  page: Page,
  minRange = 120,
): Promise<void> {
  await page.waitForFunction((min) => {
    const range =
      document.documentElement.scrollHeight - window.innerHeight;
    return range >= min;
  }, minRange);
}

export async function scrollCoachDeep(page: Page, y = 380): Promise<void> {
  const minDepth = Math.min(120, y);
  await waitCoachScrollRange(page, minDepth);
  const achieved = await page.evaluate((target) => {
    const max = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const goal = Math.min(target, max);
    window.scrollTo(0, goal);
    return goal;
  }, y);
  await page.waitForFunction(
    (expected) => window.scrollY >= expected,
    achieved,
  );
}
