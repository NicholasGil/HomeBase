import { expect, type Page } from "@playwright/test";

/** Dock sits flush above the tab bar; allow safe-area gap only. */
const MIN_COMPOSE_TAB_CLEARANCE_PX = 0;

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
const MOBILE_VIEWPORT_WIDTH = 375;

/** Sticky dock chip row fits @375 with no horizontal scroll or clipped labels. */
export async function assertDockChipRowFitsViewport(page: Page) {
  const dock = page.getByTestId("concierge-mobile-dock");
  await expect(dock).toBeVisible();
  const row = dock.getByLabel("Suggested questions");
  await expect(row).toBeVisible();
  const rowBox = await row.boundingBox();
  expect(rowBox).not.toBeNull();
  expect(rowBox!.width).toBeLessThanOrEqual(MOBILE_VIEWPORT_WIDTH + 1);
  const overflow = await row.evaluate((el) => {
    return el.scrollWidth > el.clientWidth + 1;
  });
  expect(overflow).toBe(false);
  const chips = row.getByRole("button");
  const count = await chips.count();
  for (let i = 0; i < count; i += 1) {
    const chip = chips.nth(i);
    const truncated = await chip.evaluate((button) => {
      const style = window.getComputedStyle(button);
      return style.textOverflow === "ellipsis" && button.scrollWidth > button.clientWidth + 1;
    });
    expect(truncated).toBe(false);
  }
}

/** Restored concierge answer sits above the sticky dock (scroll 0). */
export async function assertRestoredAnswerClearsDock(page: Page) {
  const dock = page.getByTestId("concierge-mobile-dock");
  const restoredThread = page.getByTestId("concierge-restored-thread");
  await expect(dock).toBeVisible();
  await expect(restoredThread).toBeVisible();
  const answer = restoredThread.getByTestId("concierge-answer");
  await expect(answer).toBeVisible();
  const dockBox = await dock.boundingBox();
  const answerBox = await answer.boundingBox();
  expect(dockBox).not.toBeNull();
  expect(answerBox).not.toBeNull();
  expect(answerBox!.y + answerBox!.height).toBeLessThanOrEqual(dockBox!.y + 1);
}

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
