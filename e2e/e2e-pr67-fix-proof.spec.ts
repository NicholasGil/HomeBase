import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { COACH_FIRST_SESSION_STARTERS } from "../src/lib/coach-first-session";

const PROOF_DIR = path.join("proof", "e2e-pr67-fix");
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

async function signInAlexWithFile(page: import("@playwright/test").Page) {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

async function assertDockDoesNotCoverCoachOnCard(
  page: import("@playwright/test").Page,
) {
  const dock = page.getByTestId("concierge-mobile-dock");
  await expect(dock).toBeVisible();
  const coachOn = page.getByTestId("coach-first-session-empty");
  if ((await coachOn.count()) > 0) {
    const dockBox = await dock.boundingBox();
    const cardBox = await coachOn.boundingBox();
    expect(dockBox).not.toBeNull();
    expect(cardBox).not.toBeNull();
    expect(dockBox!.y).toBeGreaterThanOrEqual(cardBox!.y + cardBox!.height - 2);
  }
}

async function assertNextCardClearsDock(page: import("@playwright/test").Page) {
  const dock = page.getByTestId("concierge-mobile-dock");
  const nextCard = page.getByTestId("coach-ten-second");
  await expect(dock).toBeVisible();
  await expect(nextCard).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  const dockBox = await dock.boundingBox();
  const nextBox = await nextCard.boundingBox();
  expect(dockBox).not.toBeNull();
  expect(nextBox).not.toBeNull();
  expect(nextBox!.y + nextBox!.height).toBeLessThanOrEqual(dockBox!.y + 1);
}

test("e2e-pr67 design proofs @375", async ({ page }) => {
  await mkdir(PROOF_DIR, { recursive: true });

  const discoveryStarter = COACH_FIRST_SESSION_STARTERS[0];

  await signInAlexDiscoveryEmpty(page);
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  await assertDockDoesNotCoverCoachOnCard(page);
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-discovery-dock-clearance-375.png"),
    fullPage: false,
  });

  await page.getByRole("button", { name: discoveryStarter }).click();
  await expect(
    page
      .getByTestId("concierge-first-session-thread")
      .getByTestId("concierge-answer"),
  ).toHaveAttribute("data-kind", "answer");

  await page.goto("/dashboard");
  await page.goto("/coach");
  await expect(page.getByTestId("coach-return-continue")).toBeVisible();
  await expect(page.getByTestId("coach-daily-check-in")).toBeVisible();
  await expect(page.getByTestId("concierge-mobile-dock")).toBeVisible();
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-discovery-return-375.png"),
    fullPage: false,
  });

  await signInAlexWithFile(page);
  await assertNextCardClearsDock(page);
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-file-session-dock-clearance-375.png"),
    fullPage: false,
  });

  const fileStarter = "What happens next?";
  await page
    .getByLabel("Suggested questions")
    .getByRole("button", { name: fileStarter, exact: true })
    .click();
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "answer",
  );

  await page.goto("/dashboard");
  await page.goto("/coach");
  await expect(page.getByTestId("coach-return-continue")).toContainText(
    fileStarter,
  );
  await expect(page.getByTestId("coach-daily-check-in")).toBeVisible();
  const restoredThread = page.getByTestId("concierge-restored-thread");
  await expect(restoredThread).toBeVisible();
  const restoredAnswer = restoredThread.getByTestId("concierge-answer");
  await restoredAnswer.scrollIntoViewIfNeeded();
  await expect(restoredAnswer).toBeInViewport();
  await expect(page.getByTestId("concierge-mobile-dock")).toBeVisible();
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-file-return-375.png"),
    fullPage: false,
  });
});
