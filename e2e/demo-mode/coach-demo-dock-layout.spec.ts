import { expect, test } from "../fixtures";

import { CONCIERGE_STARTERS } from "../../src/lib/concierge-starters";
import {
  discoveryDockPreviewLabels,
  fileSessionDockPreviewLabels,
} from "../../src/lib/concierge-dock-chips";
import { COACH_FIRST_SESSION_STARTERS } from "../../src/lib/coach-first-session";
import {
  assertDockChipRowFitsViewport,
  assertComposeClearsTabBar,
} from "../coach-dock-assertions";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function openMoreSheet(page: import("@playwright/test").Page) {
  const trigger = page.getByTestId("concierge-more-starters");
  await trigger.click();
  const sheet = page.getByTestId("concierge-more-starters-sheet");
  await expect(sheet).toBeVisible();
  return sheet;
}

async function assertChipCenterHits(
  page: import("@playwright/test").Page,
  chip: import("@playwright/test").Locator,
) {
  await expect(chip).toBeVisible();
  await chip.click({ trial: true });
}

test("demo discovery @375 — dock chips fit; More sheet starters are tappable", async ({
  page,
}) => {
  await page.goto("/demo/enter/buyer-discovery");
  await expect(page).toHaveURL(/\/coach$/, { timeout: 30_000 });
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  await expect(page.getByTestId("concierge-idle-hint")).toHaveCount(0);
  await expect(
    page.getByText(/Tap a starter or ask below/i),
  ).toHaveCount(1);
  await assertDockChipRowFitsViewport(page);
  await assertComposeClearsTabBar(page);

  for (const label of discoveryDockPreviewLabels()) {
    await expect(
      page.getByLabel("Suggested questions").getByRole("button", { name: label }),
    ).toBeVisible();
  }

  const sheet = await openMoreSheet(page);
  for (const question of COACH_FIRST_SESSION_STARTERS) {
    const chip = sheet.getByRole("button", { name: question });
    await expect(chip).toBeVisible();
    await assertChipCenterHits(page, chip);
  }

  const moreStarter = COACH_FIRST_SESSION_STARTERS[0];
  await sheet.getByRole("button", { name: moreStarter }).click();
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "answer",
    { timeout: 20_000 },
  );
});

test("demo file session @375 — dock chips fit; all canonical starters reachable", async ({
  page,
}) => {
  await page.goto("/demo/enter/buyer-coach");
  await expect(page).toHaveURL(/\/coach$/, { timeout: 30_000 });
  await assertDockChipRowFitsViewport(page);
  await assertComposeClearsTabBar(page);

  for (const label of fileSessionDockPreviewLabels()) {
    await expect(
      page.getByLabel("Suggested questions").getByRole("button", { name: label }),
    ).toBeVisible();
  }

  const sheet = await openMoreSheet(page);
  for (const question of CONCIERGE_STARTERS) {
    const chip = sheet.getByRole("button", { name: question });
    await expect(chip).toBeVisible();
    await assertChipCenterHits(page, chip);
  }

  const moreStarter = CONCIERGE_STARTERS[0];
  await sheet.getByRole("button", { name: moreStarter }).click();
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "answer",
    { timeout: 20_000 },
  );
});
