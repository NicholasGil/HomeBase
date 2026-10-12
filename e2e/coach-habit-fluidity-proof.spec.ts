import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import {
  CONCIERGE_STARTERS,
  FILE_SESSION_CONCIERGE_STARTERS,
  FILE_SESSION_MORE_CONCIERGE_STARTERS,
} from "../src/lib/concierge-starters";

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

async function starterChip(
  page: import("@playwright/test").Page,
  label: string,
) {
  const aliases =
    label === "When is my inspection?"
      ? ["When's my inspection?", "When is my inspection?"]
      : [label];
  const dock = page.getByTestId("concierge-mobile-dock");
  if ((await dock.count()) > 0) {
    for (const name of aliases) {
      const chip = dock.getByRole("button", { name, exact: true });
      if ((await chip.count()) > 0) {
        return chip;
      }
    }
    await page.getByTestId("concierge-more-questions").click();
    return page
      .getByTestId("concierge-more-questions-sheet")
      .getByRole("button", { name: label, exact: true });
  }
  const row = page.getByLabel("Suggested questions");
  for (const name of aliases) {
    const visible = row.getByRole("button", { name, exact: true });
    if ((await visible.count()) > 0) {
      return visible;
    }
  }
  await page.getByTestId("concierge-more-questions").click();
  return page
    .getByTestId("concierge-more-questions-sheet")
    .getByRole("button", { name: label, exact: true });
}

async function assertAskCenterHitsButton(page: import("@playwright/test").Page) {
  if ((await page.getByTestId("concierge-more-questions-sheet").count()) > 0) {
    await page.keyboard.press("Escape");
  }
  const dock = page.getByTestId("concierge-mobile-dock");
  const ask =
    (await dock.count()) > 0
      ? dock.getByTestId("concierge-ask")
      : page.getByTestId("concierge-compose").getByTestId("concierge-ask");
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
  const chip = await starterChip(page, label);
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
  if ((await page.getByTestId("concierge-more-questions-sheet").count()) > 0) {
    await page.keyboard.press("Escape");
  }
}

async function assertChipClearsComposeAtScrollEnd(
  page: import("@playwright/test").Page,
  label: string,
) {
  const chip = await starterChip(page, label);
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

  await signInAlexWithFile(page);
  await expect(page.getByTestId("coach-ten-second")).toBeVisible();
  const fileReachable = [
    ...FILE_SESSION_CONCIERGE_STARTERS,
    ...FILE_SESSION_MORE_CONCIERGE_STARTERS,
  ];
  for (const label of FILE_SESSION_CONCIERGE_STARTERS) {
    await assertChipCenterHitsButton(page, label);
  }
  await assertAskCenterHitsButton(page);
  await scrollConciergeToEnd(page);
  for (const label of FILE_SESSION_CONCIERGE_STARTERS) {
    await assertChipCenterHitsButton(page, label);
    await assertChipClearsComposeAtScrollEnd(page, label);
  }
  for (const label of FILE_SESSION_MORE_CONCIERGE_STARTERS) {
    const chip = await starterChip(page, label);
    await expect(chip).toBeVisible();
    if ((await page.getByTestId("concierge-more-questions-sheet").count()) > 0) {
      await page.keyboard.press("Escape");
    }
  }
  if ((await page.getByTestId("concierge-more-questions-sheet").count()) > 0) {
    await page.keyboard.press("Escape");
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
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "answer",
    { timeout: 15_000 },
  );

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

  for (const label of FILE_SESSION_CONCIERGE_STARTERS) {
    await assertChipCenterHitsButton(page, label);
  }
  for (const label of FILE_SESSION_MORE_CONCIERGE_STARTERS) {
    await page.getByTestId("concierge-more-questions").click();
    await expect(
      page
        .getByTestId("concierge-more-questions-sheet")
        .getByRole("button", { name: label, exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  }
  await assertAskCenterHitsButton(page);

  await page.screenshot({
    path: path.join(PROOF_DIR, "file-return-chips-clear-375.png"),
    fullPage: false,
  });
});
