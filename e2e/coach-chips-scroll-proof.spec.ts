import { expect, test } from "@playwright/test";

import { FILE_SESSION_CONCIERGE_STARTERS } from "../src/lib/concierge-starters";

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

test("last suggestion chip clears sticky Ask at scroll end @375", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );

  const starters = page.getByLabel("Suggested questions").first();
  const lastChip = starters.getByRole("button", {
    name: FILE_SESSION_CONCIERGE_STARTERS.at(-1)!,
  });
  const firstChip = starters.getByRole("button", {
    name: FILE_SESSION_CONCIERGE_STARTERS[0],
  });
  const compose = page.getByTestId("concierge-compose");
  const tabBar = page.getByTestId("app-tab-bar");

  for (const chip of [firstChip, lastChip]) {
    const chipBox = await chip.boundingBox();
    const composeBox = await compose.boundingBox();
    expect(chipBox).not.toBeNull();
    expect(composeBox).not.toBeNull();
    expect(chipBox!.y + chipBox!.height).toBeLessThanOrEqual(composeBox!.y + 1);
  }

  const composeBox = await compose.boundingBox();
  const barBox = await tabBar.boundingBox();
  expect(composeBox).not.toBeNull();
  expect(barBox).not.toBeNull();
  expect(composeBox!.y + composeBox!.height).toBeLessThanOrEqual(barBox!.y + 1);

  await page.screenshot({
    path: "docs/screenshots/coach-chips-clear-above-ask-375.png",
    fullPage: false,
  });
});
