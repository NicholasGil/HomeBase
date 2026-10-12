import { expect, test } from "@playwright/test";

import {
  FILE_SESSION_CONCIERGE_STARTERS,
  FILE_SESSION_MORE_CONCIERGE_STARTERS,
} from "../src/lib/concierge-starters";

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
  const firstChip = starters.getByRole("button", {
    name: FILE_SESSION_CONCIERGE_STARTERS[0],
    exact: true,
  });
  const lastChip = starters.getByRole("button", {
    name: FILE_SESSION_CONCIERGE_STARTERS.at(-1)!,
    exact: true,
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

test("all eight canonical starters are reachable on the dock row or More sheet @375", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  const reachable = [
    ...FILE_SESSION_CONCIERGE_STARTERS,
    ...FILE_SESSION_MORE_CONCIERGE_STARTERS,
  ];
  for (const label of reachable) {
    const row = page.getByLabel("Suggested questions");
    const visible = row.getByRole("button", { name: label, exact: true });
    if ((await visible.count()) > 0) {
      await expect(visible).toBeVisible();
      continue;
    }
    await page.getByTestId("concierge-more-questions").click();
    await expect(
      page
        .getByTestId("concierge-more-questions-sheet")
        .getByRole("button", { name: label, exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  }
});
