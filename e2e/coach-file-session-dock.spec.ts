import { expect, test } from "@playwright/test";

import {
  assertComposeClearsTabBar,
  assertNextCardClearsDock,
} from "./coach-dock-assertions";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

test("coach file session @375 — NEXT clears dock and compose clears tab bar", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("coach-ten-second")).toBeVisible();
  await expect(page.getByTestId("concierge-mobile-dock")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await assertNextCardClearsDock(page);
  await assertComposeClearsTabBar(page);
});

test("coach file session @375 — typed Ask submits above dock", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  const dock = page.getByTestId("concierge-mobile-dock");
  await expect(dock).toBeVisible();
  const question = "When is my inspection?";
  await page.getByTestId("concierge-question").fill(question);
  await page.getByTestId("concierge-ask").click();
  const answer = page.getByTestId("concierge-answer");
  await expect(answer).toBeVisible({ timeout: 15_000 });
  await expect(answer).toHaveAttribute("data-kind", "answer");
  const dockTop = (await dock.boundingBox())!.y;
  const answerBox = await answer.boundingBox();
  expect(answerBox).not.toBeNull();
  expect(answerBox!.y + answerBox!.height).toBeLessThanOrEqual(dockTop + 1);
  await expect(
    page.locator('[aria-live="polite"]').getByText(question, { exact: true }),
  ).toBeVisible();
});
