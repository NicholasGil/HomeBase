import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { COACH_FIRST_SESSION_STARTERS } from "../src/lib/coach-first-session";

const PROOF_DIR = path.join("proof", "coach-return-visit");
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

test("return visit proof @375 — discovery thread, file thread, daily check-in", async ({
  page,
}) => {
  await mkdir(PROOF_DIR, { recursive: true });

  const starter = COACH_FIRST_SESSION_STARTERS[0];

  await signInAlexDiscoveryEmpty(page);
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  await page.getByRole("button", { name: starter }).click();
  await expect(
    page
      .getByTestId("concierge-first-session-thread")
      .getByTestId("concierge-answer"),
  ).toHaveAttribute("data-kind", "answer", { timeout: 15_000 });

  await page.goto("/dashboard");
  await page.goto("/coach");
  await expect(page.getByTestId("coach-return-continue")).toBeVisible();
  await expect(page.getByTestId("coach-daily-check-in")).toBeVisible();
  await expect(page.getByTestId("coach-first-session-empty")).toHaveCount(0);
  await expect(
    page
      .getByTestId("concierge-first-session-thread")
      .getByTestId("concierge-answer"),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-discovery-return-375.png"),
    fullPage: false,
  });

  await signInAlexWithFile(page);
  const fileStarter = "What happens next?";
  await page.getByRole("button", { name: fileStarter }).click();
  await expect(
    page.getByTestId("concierge-answer"),
  ).toHaveAttribute("data-kind", "answer", { timeout: 15_000 });

  await page.goto("/dashboard");
  await page.goto("/coach");
  await expect(page.getByTestId("coach-return-continue")).toContainText(
    fileStarter,
  );
  await expect(page.getByTestId("coach-daily-check-in")).toBeVisible();
  const restoredThread = page.getByTestId("concierge-restored-thread");
  await expect(restoredThread).toBeVisible();
  const restoredAnswer = restoredThread.getByTestId("concierge-answer");
  await expect(restoredAnswer).toBeVisible();
  await restoredAnswer.scrollIntoViewIfNeeded();
  await expect(restoredAnswer).toBeInViewport();
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-file-return-375.png"),
    fullPage: false,
  });
});
