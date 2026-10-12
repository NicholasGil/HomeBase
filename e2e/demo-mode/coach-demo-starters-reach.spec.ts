import { expect, test } from "@playwright/test";

import { CONCIERGE_STARTERS } from "../../src/lib/concierge-starters";
import { fileSessionDockPreviewLabels } from "../../src/lib/concierge-dock-chips";

const DOCK_STARTERS = new Set<string>(fileSessionDockPreviewLabels());

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function signInDemoBuyerCoach(page: import("@playwright/test").Page) {
  await page.goto("/demo/enter/buyer-coach");
  await expect(page).toHaveURL(/\/coach$/, { timeout: 30_000 });
  await expect(page.getByTestId("concierge-mobile-dock")).toBeVisible();
}

async function assertStarterTappable(
  page: import("@playwright/test").Page,
  label: string,
) {
  const moreTrigger = page.getByTestId("concierge-more-starters");
  const needsMoreSheet =
    !DOCK_STARTERS.has(label) && (await moreTrigger.isVisible());
  let chip;
  if (needsMoreSheet) {
    await moreTrigger.click();
    const sheet = page.getByTestId("concierge-more-starters-sheet");
    await expect(sheet).toBeVisible();
    chip = sheet.getByRole("button", { name: label });
  } else {
    chip = page
      .getByLabel("Suggested questions")
      .getByRole("button", { name: label });
  }
  await chip.scrollIntoViewIfNeeded();
  await expect(chip).toBeVisible();
  await expect(chip).toBeEnabled();
  if (needsMoreSheet) {
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("concierge-more-starters-sheet")).toBeHidden();
  }
}

test("demo file session @375 — all CONCIERGE_STARTERS reachable via dock or More", async ({
  page,
}) => {
  await signInDemoBuyerCoach(page);
  await expect(page.getByTestId("concierge-more-starters")).toBeVisible();
  for (const label of CONCIERGE_STARTERS) {
    await assertStarterTappable(page, label);
  }
});
