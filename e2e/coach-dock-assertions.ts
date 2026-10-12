import { expect, type Page } from "@playwright/test";

const MIN_COMPOSE_TAB_CLEARANCE_PX = 16;

/** File-session @375: NEXT card must sit fully above the sticky concierge dock. */
export async function assertNextCardClearsDock(page: Page) {
  const next = page.getByTestId("ten-second-next");
  const dock = page.getByTestId("concierge-mobile-dock");
  await expect(next).toBeVisible();
  await expect(dock).toBeVisible();
  const nextBox = await next.boundingBox();
  const dockBox = await dock.boundingBox();
  expect(nextBox).not.toBeNull();
  expect(dockBox).not.toBeNull();
  const nextBottom = nextBox!.y + nextBox!.height;
  const dockTop = dockBox!.y;
  expect(nextBottom).toBeLessThanOrEqual(dockTop + 0.5);
}

/** Sticky Ask compose row clears the bottom tab bar (no overlap). */
export async function assertComposeClearsTabBar(
  page: Page,
  minClearancePx = MIN_COMPOSE_TAB_CLEARANCE_PX,
) {
  const compose = page.getByTestId("concierge-compose");
  const tabBar = page.getByTestId("app-tab-bar");
  await expect(compose).toBeVisible();
  await expect(tabBar).toBeVisible();
  const composeBox = await compose.boundingBox();
  const tabBox = await tabBar.boundingBox();
  expect(composeBox).not.toBeNull();
  expect(tabBox).not.toBeNull();
  const clearance = tabBox!.y - (composeBox!.y + composeBox!.height);
  expect(clearance).toBeGreaterThanOrEqual(minClearancePx);
  return clearance;
}

/** Discovery uses an inner scroll region; file session scrolls the document. */
export async function scrollCoachConciergeToEnd(page: Page) {
  const dock = page.getByTestId("concierge-mobile-dock");
  if (await dock.isVisible().catch(() => false)) {
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    return;
  }
  const scroll = page.getByTestId("concierge-scroll-region");
  await scroll.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
}
