import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { CONCIERGE_STARTERS } from "../src/components/concierge-chat";

const PROOF_DIR = path.join("proof", "coach-habit-fluidity");
const MIN_CHIP_HEIGHT = 44;

test.use({
  viewport: { width: 375, height: 812 },
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

function conciergeScrollRegion(page: import("@playwright/test").Page) {
  return page.getByTestId("concierge-scroll-region");
}

async function scrollConciergeToEnd(page: import("@playwright/test").Page) {
  const scroll = conciergeScrollRegion(page);
  await scroll.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
}

async function assertAskCenterHitsButton(page: import("@playwright/test").Page) {
  const ask = page.getByTestId("concierge-compose").getByTestId("concierge-ask");
  await expect(ask).toBeVisible();
  const hit = await ask.evaluate((button) => {
    const box = button.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const el = document.elementFromPoint(cx, cy);
    return el !== null && button.contains(el);
  });
  expect(hit).toBe(true);
}

async function assertChipCenterHitsButton(
  page: import("@playwright/test").Page,
  label: string,
) {
  const chip = page
    .getByLabel("Suggested questions")
    .getByRole("button", { name: label });
  await chip.scrollIntoViewIfNeeded();
  await chip.evaluate((el) => {
    el.scrollIntoView({ block: "nearest", inline: "center" });
  });
  const box = await chip.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box!.height)).toBeGreaterThanOrEqual(MIN_CHIP_HEIGHT);

  const cx = box!.x + box!.width / 2;
  const cy = box!.y + box!.height / 2;
  const hit = await page.evaluate(
    ({ cx, cy, label }) => {
      const el = document.elementFromPoint(cx, cy);
      const chip = [...document.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === label,
      );
      return chip !== undefined && el !== null && chip.contains(el);
    },
    { cx, cy, label },
  );
  expect(hit).toBe(true);
}

async function assertChipClearsComposeAtScrollEnd(
  page: import("@playwright/test").Page,
  label: string,
) {
  const chip = page
    .getByLabel("Suggested questions")
    .getByRole("button", { name: label });
  const compose = page.getByTestId("concierge-compose");
  const chipBox = await chip.boundingBox();
  const composeBox = await compose.boundingBox();
  expect(chipBox).not.toBeNull();
  expect(composeBox).not.toBeNull();
  const clearance = composeBox!.y - (chipBox!.y + chipBox!.height);
  expect(chipBox!.y + chipBox!.height).toBeLessThanOrEqual(composeBox!.y + 1);
  expect(clearance).toBeGreaterThanOrEqual(0);
}

test("coach habit fluidity — chip center hits + scroll-end clearance @375", async ({
  page,
}) => {
  await mkdir(PROOF_DIR, { recursive: true });

  const discoveryStarters = [
    "What happens next?",
    "What am I missing for this stage?",
    "What's already on my file?",
  ] as const;

  await signInAlexDiscoveryEmpty(page);
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  for (const label of discoveryStarters) {
    await assertChipCenterHitsButton(page, label);
  }
  await assertAskCenterHitsButton(page);
  await scrollConciergeToEnd(page);
  for (const label of discoveryStarters) {
    await assertChipCenterHitsButton(page, label);
    await assertChipClearsComposeAtScrollEnd(page, label);
  }
  await page.screenshot({
    path: path.join(PROOF_DIR, "discovery-empty-chips-clear-375.png"),
    fullPage: false,
  });

  const fileStarters = [
    "What happens next?",
    "When do I leave for my first showing?",
  ] as const;

  await signInAlexWithFile(page);
  await expect(page.getByTestId("coach-ten-second")).toBeVisible();
  for (const label of fileStarters) {
    await assertChipCenterHitsButton(page, label);
  }
  await assertAskCenterHitsButton(page);
  await scrollConciergeToEnd(page);
  for (const label of fileStarters) {
    await assertChipCenterHitsButton(page, label);
    await assertChipClearsComposeAtScrollEnd(page, label);
  }
  await page.screenshot({
    path: path.join(PROOF_DIR, "file-session-chips-clear-375.png"),
    fullPage: false,
  });

  const fileReturnStarter = CONCIERGE_STARTERS[0];
  await page
    .getByLabel("Suggested questions")
    .first()
    .getByRole("button", { name: fileReturnStarter })
    .click();
  await expect(
    page.getByTestId("concierge-scroll-region").getByTestId("concierge-answer"),
  ).toHaveAttribute("data-kind", "answer", { timeout: 15_000 });

  await page.goto("/pricing");
  await page.getByTestId("pricing-continue-coach").click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("concierge")).toBeVisible();

  await expect(page.getByTestId("coach-return-continue")).toContainText(
    fileReturnStarter,
  );
  const restoredThread = page.getByTestId("concierge-restored-thread");
  await expect(restoredThread).toBeVisible();
  const restoredAnswer = restoredThread.getByTestId("concierge-answer");
  await expect(restoredAnswer).toBeInViewport();

  for (const label of CONCIERGE_STARTERS) {
    await assertChipCenterHitsButton(page, label);
  }
  await assertAskCenterHitsButton(page);

  await page.screenshot({
    path: path.join(PROOF_DIR, "file-return-chips-clear-375.png"),
    fullPage: false,
  });
});
