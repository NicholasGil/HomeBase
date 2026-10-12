import { expect, test } from "@playwright/test";

import { CONCIERGE_STARTERS } from "../src/lib/concierge-starters";
import { FILE_SESSION_CONCIERGE_STARTERS } from "../src/lib/concierge-starters";

const DOCK_STARTERS = new Set<string>(FILE_SESSION_CONCIERGE_STARTERS);

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function signInDemoBuyerCoach(page: import("@playwright/test").Page) {
  await page.goto("/demo");
  await page.getByTestId("demo-persona-buyer-coach").getByRole("button").click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("concierge-mobile-dock")).toBeVisible();
}

async function assertStarterTappable(
  page: import("@playwright/test").Page,
  label: string,
) {
  let chip;
  if (DOCK_STARTERS.has(label)) {
    chip = page
      .getByLabel("Suggested questions")
      .getByRole("button", { name: label });
  } else {
    await page.getByTestId("concierge-more-starters").click();
    const sheet = page.getByTestId("concierge-more-starters-sheet");
    await expect(sheet).toBeVisible();
    chip = sheet.getByRole("button", { name: label });
  }
  await chip.scrollIntoViewIfNeeded();
  await expect(chip).toBeVisible();
  await expect(chip).toBeEnabled();
  if (!DOCK_STARTERS.has(label)) {
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("concierge-more-starters-sheet")).toBeHidden();
  }
}

test("demo file session @375 — all CONCIERGE_STARTERS reachable via dock or More", async ({
  page,
}) => {
  test.skip(
    process.env.REALTYRISE_DEMO_MODE !== "1",
    "Compact demo dock + More sheet requires REALTYRISE_DEMO_MODE=1",
  );
  await signInDemoBuyerCoach(page);
  await expect(page.getByTestId("concierge-more-starters")).toBeVisible();
  for (const label of CONCIERGE_STARTERS) {
    await assertStarterTappable(page, label);
  }
});
