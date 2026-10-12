import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { discoveryDockPreviewLabels } from "../src/lib/concierge-dock-chips";
import { COACH_FIRST_SESSION_STARTERS } from "../src/lib/coach-first-session";
import { assertRestoredAnswerClearsDock } from "./coach-dock-assertions";

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

test("RET-001 @375 — first visit never shows Welcome back", async ({ page }) => {
  await signInAlexDiscoveryEmpty(page);
  await expect(page.getByText(/Welcome back/i)).toHaveCount(0);
  await expect(page.getByTestId("coach-return-continue")).toHaveCount(0);
});

test("RET-001 @375 — discovery return shows daily check-in", async ({ page }) => {
  const dockLabel = discoveryDockPreviewLabels()[0];
  await signInAlexDiscoveryEmpty(page);
  await page.getByRole("button", { name: dockLabel }).click();
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "answer",
    { timeout: 15_000 },
  );
  await page.goto("/dashboard");
  await page.goto("/coach");
  await expect(page.getByTestId("coach-daily-check-in")).toBeVisible();
  await expect(page.getByText(/Welcome back/i)).toHaveCount(0);
});

test("RET-003 @375 — discovery return shows continue header scoped to thread", async ({
  page,
}) => {
  const dockLabel = discoveryDockPreviewLabels()[0];
  const starter = COACH_FIRST_SESSION_STARTERS[0];
  await signInAlexDiscoveryEmpty(page);
  await page.getByRole("button", { name: dockLabel }).click();
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "answer",
    { timeout: 15_000 },
  );
  await page.goto("/dashboard");
  await page.goto("/coach");
  const continueHeader = page.getByTestId("coach-return-continue");
  await expect(continueHeader).toBeVisible();
  await expect(continueHeader).toContainText(starter);
  const discoveryThread = page.getByTestId("concierge-first-session-thread");
  await expect(discoveryThread).toBeVisible();
  await expect(discoveryThread.getByTestId("concierge-user-question")).toContainText(
    starter,
  );
});

test("RET-002 @375 — file reload with check-in keeps restored answer above dock", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await page
    .getByLabel("Suggested questions")
    .getByRole("button", { name: "What happens next?" })
    .click();
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "answer",
    { timeout: 15_000 },
  );
  await page.goto("/dashboard");
  await page.goto("/coach");
  await expect(page.getByTestId("coach-daily-check-in")).toBeVisible();
  await expect(page.getByTestId("concierge-restored-thread")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("concierge-restored-thread")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await assertRestoredAnswerClearsDock(page);
});

test("RET-002 @375 — return visit without thread shows daily check-in", async ({
  page,
}) => {
  await signInAlexWithFile(page);
  await expect(page.getByTestId("coach-ten-second")).toBeVisible();
  await expect(page.getByTestId("concierge-answer")).toHaveCount(0);

  await page.goto("/dashboard");
  await page.goto("/coach");
  await expect(page.getByTestId("coach-daily-check-in")).toBeVisible();
  await expect(page.getByTestId("concierge-restored-thread")).toHaveCount(0);
});

test("return visit proof @375 — discovery thread, file thread, daily check-in", async ({
  page,
}) => {
  await mkdir(PROOF_DIR, { recursive: true });

  const dockLabel = discoveryDockPreviewLabels()[0];

  await signInAlexDiscoveryEmpty(page);
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  await page.getByRole("button", { name: dockLabel }).click();
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "answer",
    { timeout: 15_000 },
  );

  await page.goto("/dashboard");
  await page.goto("/coach");
  await expect(page.getByTestId("coach-daily-check-in")).toBeVisible();
  await expect(page.getByTestId("concierge-user-question")).toBeVisible();
  await expect(page.getByTestId("coach-first-session-empty")).toHaveCount(0);
  await expect(page.getByTestId("concierge-answer")).toBeVisible();
  await expect(page.getByTestId("concierge-user-question")).toBeVisible();
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-discovery-return-375.png"),
    fullPage: false,
  });

  await signInAlexWithFile(page);
  const fileStarter = "What happens next?";
  await page
    .getByLabel("Suggested questions")
    .getByRole("button", { name: fileStarter })
    .click();
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "answer",
    { timeout: 15_000 },
  );

  await page.goto("/dashboard");
  await page.goto("/coach");
  await expect(page.getByTestId("coach-return-continue")).toContainText(
    fileStarter,
  );
  await expect(page.getByTestId("coach-daily-check-in")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await assertRestoredAnswerClearsDock(page);
  const restoredThread = page.getByTestId("concierge-restored-thread");
  const restoredAnswer = restoredThread.getByTestId("concierge-answer");
  await expect(restoredAnswer).toBeInViewport();
  await page.screenshot({
    path: path.join(PROOF_DIR, "coach-file-return-375.png"),
    fullPage: false,
  });
});
