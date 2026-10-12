import { expect, test } from "@playwright/test";

import { CONCIERGE_STARTERS } from "../../src/lib/concierge-starters";
import { FILE_SESSION_DOCK_CHIPS } from "../../src/lib/concierge-dock-chips";

const DOCK_LABEL_BY_QUESTION = new Map(
  FILE_SESSION_DOCK_CHIPS.map((chip) => [chip.question, chip.label]),
);

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

async function tapStarterAndAssertAnswer(
  page: import("@playwright/test").Page,
  question: string,
) {
  const dockLabel = DOCK_LABEL_BY_QUESTION.get(question);
  if (dockLabel !== undefined) {
    const chip = page
      .getByLabel("Suggested questions")
      .getByRole("button", { name: dockLabel });
    await chip.scrollIntoViewIfNeeded();
    await expect(chip).toBeVisible();
    await chip.click();
  } else {
    await page.getByTestId("concierge-more-starters").click();
    const sheet = page.getByTestId("concierge-more-starters-sheet");
    await expect(sheet).toBeVisible();
    const chip = sheet.getByRole("button", { name: question });
    await chip.scrollIntoViewIfNeeded();
    await expect(chip).toBeVisible();
    await chip.click();
  }
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "answer",
    { timeout: 20_000 },
  );
}

test("demo file session @375 — all CONCIERGE_STARTERS reachable via dock or More", async ({
  page,
}) => {
  await signInDemoBuyerCoach(page);
  await expect(page.getByTestId("concierge-more-starters")).toBeVisible();
  for (const question of CONCIERGE_STARTERS) {
    await tapStarterAndAssertAnswer(page, question);
  }
});
