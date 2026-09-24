import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const PROOF_DIR = path.join("proof", "coach-return-visit");

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function signInAlexWithFile(page: import("@playwright/test").Page) {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

async function seedReturnVisit(
  page: import("@playwright/test").Page,
  threadQuestion = "What happens next?",
) {
  const storageKey =
    "realtyrise:coach:v1:clerk_buyer_a:seed:buyer-a";
  await page.addInitScript(
    ({ key, question }) => {
      const visit = {
        firstSeenAt: 1,
        lastSeenAt: 2,
        dailyCheckInDay: null,
      };
      window.localStorage.setItem(`${key}:visit`, JSON.stringify(visit));
      window.localStorage.setItem(
        `${key}:thread`,
        JSON.stringify([
          {
            question,
            answer: "Schedule inspection — your agent owns timing.",
            kind: "answer",
          },
        ]),
      );
    },
    { key: storageKey, question: threadQuestion },
  );
}

test("return visit is warm — welcome back, daily check-in, persisted thread @375", async ({
  page,
}) => {
  await mkdir(PROOF_DIR, { recursive: true });
  await seedReturnVisit(page);
  await signInAlexWithFile(page);

  await expect(page.getByTestId("coach-return-visit")).toBeVisible();
  await expect(page.getByTestId("coach-daily-check-in")).toBeVisible();
  await expect(page.getByTestId("coach-first-session-empty")).toHaveCount(0);
  await expect(page.getByTestId("coach-ten-second")).toBeVisible();

  const thread = page.getByTestId("concierge-thread-turn");
  await expect(thread).toContainText("What happens next?");
  await expect(thread.getByTestId("concierge-answer")).toContainText(
    "Schedule inspection",
  );

  const checkInButton = page
    .getByTestId("coach-daily-check-in")
    .getByRole("button")
    .first();
  const box = await checkInButton.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box!.height)).toBeGreaterThanOrEqual(44);

  await page.screenshot({
    path: path.join(PROOF_DIR, "return-visit-daily-ritual-375.png"),
    fullPage: false,
  });

  await checkInButton.click();
  await expect(page.getByTestId("coach-daily-check-in")).toHaveCount(0);
  await expect(page.getByTestId("concierge-answer").last()).toBeVisible({
    timeout: 15_000,
  });

  await page.reload();
  await expect(page.getByTestId("coach-return-visit")).toBeVisible();
  await expect(page.getByTestId("concierge-thread-turn").first()).toContainText(
    "What happens next?",
  );

  await page.screenshot({
    path: path.join(PROOF_DIR, "thread-persist-reload-375.png"),
    fullPage: false,
  });
});

test("true first discovery session stays cold-open @375", async ({ page }) => {
  await page.goto("/test-login");
  await page
    .getByTestId("sign-in-alex-discovery-empty")
    .getByRole("button")
    .click();
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  await expect(page.getByTestId("coach-return-visit")).toHaveCount(0);
  await expect(page.getByTestId("coach-daily-check-in")).toHaveCount(0);
});

test("second live visit after asking persists thread @375", async ({ page }) => {
  await signInAlexWithFile(page);
  await page
    .getByTestId("concierge")
    .getByRole("button", { name: "What happens next?" })
    .click();
  await expect(page.getByTestId("concierge-answer")).toContainText(
    "Schedule inspection",
    { timeout: 15_000 },
  );

  await page.reload();
  await expect(page.getByTestId("coach-return-visit")).toBeVisible();
  await expect(page.getByTestId("concierge-thread-turn")).toContainText(
    "What happens next?",
  );
  await expect(page.getByTestId("concierge-answer")).toContainText(
    "Schedule inspection",
  );
});
