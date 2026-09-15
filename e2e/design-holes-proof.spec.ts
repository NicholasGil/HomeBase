import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const PROOF_DIR = path.join("proof", "design-holes");
const VIEWPORT = { width: 375, height: 812 };
const MIN_FAB_CLEARANCE_PX = 16;

test.use({
  viewport: VIEWPORT,
  hasTouch: true,
  isMobile: true,
});

async function signInAlexDiscoveryEmpty(
  page: import("@playwright/test").Page,
) {
  await page.goto("/test-login");
  await page
    .getByTestId("sign-in-alex-discovery-empty")
    .getByRole("button")
    .click();
  await expect(page).toHaveURL(/\/coach$/);
}

async function signInAlex(page: import("@playwright/test").Page) {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

async function assertComposeClearsTabBar(
  page: import("@playwright/test").Page,
) {
  const compose = page.getByTestId("concierge-compose");
  const tabBar = page.getByTestId("app-tab-bar");
  const composeBox = await compose.boundingBox();
  const tabBox = await tabBar.boundingBox();
  expect(composeBox).not.toBeNull();
  expect(tabBox).not.toBeNull();
  const clearance = tabBox!.y - (composeBox!.y + composeBox!.height);
  expect(clearance).toBeGreaterThanOrEqual(MIN_FAB_CLEARANCE_PX);
  return clearance;
}

test("design holes proof @375 — screenshots + clearance", async ({ page }) => {
  await mkdir(PROOF_DIR, { recursive: true });

  await signInAlexDiscoveryEmpty(page);
  await expect(page.getByTestId("coach-home")).toBeVisible();
  await expect(page.getByTestId("concierge-fab")).toHaveCount(0);
  await expect(page.getByTestId("coach-home").locator("h1")).toHaveClass(
    /text-h2/,
  );
  await assertComposeClearsTabBar(page);
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-discovery-empty-ask-clearance-375.png"),
    fullPage: false,
  });

  await signInAlex(page);
  await expect(page.getByTestId("coach-home")).toBeVisible();
  await expect(page.getByTestId("concierge-fab")).toHaveCount(0);
  await assertComposeClearsTabBar(page);
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-file-session-ask-clearance-375.png"),
    fullPage: false,
  });

  await page.goto("/pricing");
  await expect(page.getByTestId("pricing-page")).toBeVisible();
  await expect(page.getByTestId("pricing-page").locator("h1")).toHaveClass(
    /text-display/,
  );

  const fab = page.getByTestId("concierge-fab");
  await expect(fab).toBeVisible();
  const fabBox = await fab.boundingBox();
  const tabBar = page.getByTestId("app-tab-bar");
  const pricingTabBox = await tabBar.boundingBox();
  expect(fabBox).not.toBeNull();
  expect(pricingTabBox).not.toBeNull();
  const fabClearance =
    pricingTabBox!.y - (fabBox!.y + fabBox!.height);
  expect(fabClearance).toBeGreaterThanOrEqual(MIN_FAB_CLEARANCE_PX);

  await page.screenshot({
    path: path.join(PROOF_DIR, "pricing-fab-tab-clearance-375.png"),
    fullPage: false,
  });

  await page.goto("/sign-in");
  await expect(page.getByTestId("sign-in-fixture-fallback")).toBeVisible();
  const notice = page.getByTestId("buyer-auth-env-notice");
  await expect(notice).not.toContainText(/needs-human/i);
  await expect(notice).not.toContainText(/Clerk keys are not set/i);
  await page.screenshot({
    path: path.join(PROOF_DIR, "sign-in-sold-path-copy-375.png"),
    fullPage: false,
  });
});
