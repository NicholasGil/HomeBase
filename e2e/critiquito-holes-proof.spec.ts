import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const PROOF_DIR = path.join("proof", "critiquito-holes");
const VIEWPORT = { width: 375, height: 812 };

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

test("critiquito holes proof @375 — pricing hierarchy + coach lock chrome", async ({
  page,
}) => {
  await mkdir(PROOF_DIR, { recursive: true });

  await page.goto("/pricing");
  await expect(page.getByTestId("pricing-coach-hero")).toBeVisible();
  await expect(page.getByTestId("pricing-coach-price")).toBeVisible();
  const heroPrice = page.getByTestId("pricing-coach-price");
  const lockedTitle = page
    .getByTestId("locked-upsell-search")
    .getByText("Property search");
  const heroBox = await heroPrice.boundingBox();
  const lockedBox = await lockedTitle.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(lockedBox).not.toBeNull();
  expect(heroBox!.height).toBeGreaterThan(lockedBox!.height);

  await page.screenshot({
    path: path.join(PROOF_DIR, "pricing-fold-hierarchy-375.png"),
    fullPage: false,
  });

  await signInAlexDiscoveryEmpty(page);
  await expect(page.getByTestId("locked-upsell-rail")).toBeVisible();
  await expect(page.getByTestId("app-tab-bar").locator('[data-locked="true"]')).not.toHaveCount(0);
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-lock-chrome-rail-375.png"),
    fullPage: false,
  });

  await page.goto("/pricing");
  const fab = page.getByTestId("concierge-fab");
  await expect(fab).toBeVisible();
  const fabBox = await fab.boundingBox();
  const tabBar = page.getByTestId("app-tab-bar");
  const tabBox = await tabBar.boundingBox();
  expect(fabBox).not.toBeNull();
  expect(tabBox).not.toBeNull();
  expect(tabBox!.y - (fabBox!.y + fabBox!.height)).toBeGreaterThanOrEqual(16);
  await page.screenshot({
    path: path.join(PROOF_DIR, "pricing-fab-tab-clearance-375.png"),
    fullPage: false,
  });
});
