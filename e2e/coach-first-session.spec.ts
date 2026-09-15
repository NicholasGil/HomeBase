import { expect, test } from "@playwright/test";

const FIRST_SESSION_STARTERS = [
  "What happens next?",
  "What am I missing for this stage?",
  "What's already on my file?",
] as const;

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function signInAlexDiscoveryEmpty(page: import("@playwright/test").Page) {
  await page.goto("/test-login");
  await page.getByTestId("sign-in-alex-discovery-empty").getByRole("button").click();
  await expect(page).toHaveURL(/\/coach$/);
}

test("empty Discovery coach shows empty state and three starters @375", async ({
  page,
}) => {
  await signInAlexDiscoveryEmpty(page);
  await expect(page.getByTestId("coach-home")).toBeVisible();
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  await expect(page.getByTestId("concierge-scope")).toContainText(
    "No property on this file yet",
  );
  await expect(page.getByTestId("concierge-scope")).toContainText("Discovery");

  const chips = page.getByLabel("Suggested questions").getByRole("button");
  await expect(chips).toHaveCount(3);
  for (const label of FIRST_SESSION_STARTERS) {
    await expect(page.getByRole("button", { name: label })).toBeVisible();
  }
  for (const chip of await chips.all()) {
    const box = await chip.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box!.height)).toBeGreaterThanOrEqual(44);
  }

  await expect(page.getByTestId("locked-upsell-rail")).toBeVisible();
  await expect(page.getByTestId("locked-upsell-search")).toBeVisible();
});

test("first-session chips clear sticky Ask at scroll end @375", async ({
  page,
}) => {
  await signInAlexDiscoveryEmpty(page);

  const scroll = page.locator('[data-testid="concierge"] > div').first();
  await scroll.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });

  const compose = page.getByTestId("concierge-compose");

  const composeBox = await compose.boundingBox();
  expect(composeBox).not.toBeNull();

  for (const label of FIRST_SESSION_STARTERS) {
    const chip = page.getByRole("button", { name: label });
    const chipBox = await chip.boundingBox();
    expect(chipBox).not.toBeNull();
    expect(chipBox!.y + chipBox!.height).toBeLessThanOrEqual(
      composeBox!.y + 1,
    );
  }
});

test("coach first-session proof screenshots @375", async ({ page }) => {
  await signInAlexDiscoveryEmpty(page);
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();

  await page.screenshot({
    path: "proof/coach-first-session/empty-coach-three-starters-375.png",
    fullPage: false,
  });

  const scroll = page.locator('[data-testid="concierge"] > div').first();
  await scroll.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });

  await page.screenshot({
    path: "proof/coach-first-session/chips-clear-above-ask-375.png",
    fullPage: false,
  });
});
