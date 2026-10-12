import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

test("last suggestion chip clears sticky Ask at scroll end @375", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  const scroll = page.getByTestId("concierge-scroll-region");
  await scroll.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });

  const starters = page.getByLabel("Suggested questions").first();
  const lastChip = starters.getByRole("button", {
    name: "When do I leave for my first showing?",
  });
  const lenderChip = starters.getByRole("button", { name: "Who is my lender?" });
  const compose = page.getByTestId("concierge-compose");
  const tabBar = page.getByTestId("app-tab-bar");

  for (const chip of [lenderChip, lastChip]) {
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
