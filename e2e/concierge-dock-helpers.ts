import { expect, type Page } from "@playwright/test";

import {
  DISCOVERY_DOCK_CHIPS,
  FILE_SESSION_DOCK_CHIPS,
} from "../src/lib/concierge-dock-chips";

function dockLabelForQuestion(question: string): string | null {
  for (const chips of [DISCOVERY_DOCK_CHIPS, FILE_SESSION_DOCK_CHIPS]) {
    const match = chips.find((chip) => chip.question === question);
    if (match !== undefined) {
      return match.label;
    }
  }
  return null;
}

export async function tapConciergeStarter(page: Page, question: string) {
  const dockLabel = dockLabelForQuestion(question) ?? question;
  const dock = page.getByLabel("Suggested questions");
  const onDock = dock.getByRole("button", { name: dockLabel, exact: true });
  if ((await onDock.count()) > 0) {
    await onDock.first().click();
    return;
  }
  const more = page.getByTestId("concierge-more-starters");
  await expect(more).toBeVisible();
  await more.click();
  const sheet = page.getByTestId("concierge-more-starters-sheet");
  await sheet
    .getByRole("button", { name: question, exact: true })
    .click();
}
