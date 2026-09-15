import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { COACH_FIRST_SESSION_STARTERS } from "../src/lib/coach-first-session";
import { BUYER_LOCKED_OS_PAYMENT_DISCLAIMER } from "../src/lib/buyer-shell";

const PROOF_DIR = path.join("proof", "critiquito-holes");
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

test("critiquito holes proof @375 — design queue post-#56", async ({ page }) => {
  await mkdir(PROOF_DIR, { recursive: true });

  await page.goto("/pricing");
  await expect(page.getByTestId("pricing-coach-hero")).toBeVisible();
  await expect(page.getByTestId("pricing-coach-price")).toHaveClass(/text-display/);
  await expect(page.getByTestId("pricing-locked-os-disclaimer")).toHaveText(
    BUYER_LOCKED_OS_PAYMENT_DISCLAIMER,
  );
  const disclaimerCount = await page
    .getByText(BUYER_LOCKED_OS_PAYMENT_DISCLAIMER, { exact: true })
    .count();
  expect(disclaimerCount).toBe(1);

  await page.screenshot({
    path: path.join(PROOF_DIR, "pricing-fold-hierarchy-375.png"),
    fullPage: false,
  });

  await page.getByTestId("pricing-not-included-heading").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(PROOF_DIR, "pricing-upsell-section-375.png"),
    fullPage: false,
  });

  await signInAlexDiscoveryEmpty(page);
  await expect(page.getByTestId("locked-upsell-rail-summary")).toBeVisible();
  await expect(page.getByTestId("locked-upsell-search")).not.toBeVisible();
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  await expect(page.getByTestId("concierge-scope")).not.toContainText("…");

  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-discovery-fold-375.png"),
    fullPage: false,
  });

  await signInAlex(page);
  await expect(page.getByTestId("locked-upsell-rail-summary")).toBeVisible();
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-file-session-lock-summary-375.png"),
    fullPage: false,
  });

  await signInAlexDiscoveryEmpty(page);
  const starter = COACH_FIRST_SESSION_STARTERS[0];
  await page.getByRole("button", { name: starter }).click();
  await expect(
    page
      .getByTestId("concierge-first-session-thread")
      .getByTestId("concierge-answer"),
  ).toHaveAttribute("data-kind", "answer", { timeout: 15_000 });
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-discovery-starter-reply-375.png"),
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
  const fabClearance = tabBox!.y - (fabBox!.y + fabBox!.height);
  expect(fabClearance).toBeGreaterThanOrEqual(MIN_FAB_CLEARANCE_PX);
  await page.screenshot({
    path: path.join(PROOF_DIR, "pricing-fab-tab-clearance-375.png"),
    fullPage: false,
  });
});
