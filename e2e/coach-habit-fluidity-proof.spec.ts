import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

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
  return page
    .locator('[data-testid="concierge"] > div.overflow-y-auto')
    .first();
}

async function scrollConciergeToEnd(page: import("@playwright/test").Page) {
  const scroll = conciergeScrollRegion(page);
  await scroll.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
}

async function assertChipCenterHitsButton(
  page: import("@playwright/test").Page,
  label: string,
) {
  const chip = page.getByRole("button", { name: label });
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
  const chip = page.getByRole("button", { name: label });
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
  await scrollConciergeToEnd(page);
  for (const label of fileStarters) {
    await assertChipCenterHitsButton(page, label);
    await assertChipClearsComposeAtScrollEnd(page, label);
  }
  await page.screenshot({
    path: path.join(PROOF_DIR, "file-session-chips-clear-375.png"),
    fullPage: false,
  });
});
