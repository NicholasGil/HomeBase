import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { COACH_FIRST_SESSION_STARTERS } from "../src/lib/coach-first-session";

const PROOF_DIR = "proof/coach-starter-replies";

const EXPECTED_SNIPPETS: Record<(typeof COACH_FIRST_SESSION_STARTERS)[number], string> =
  {
    "What happens next?": "No property is on this file yet",
    "What am I missing for this stage?": "Nothing is marked missing",
    "What's already on my file?": "Nothing is on this file yet",
  };

const STARTER_SLUGS: Record<(typeof COACH_FIRST_SESSION_STARTERS)[number], string> =
  {
    "What happens next?": "what-happens-next",
    "What am I missing for this stage?": "what-am-i-missing-for-this-stage",
    "What's already on my file?": "whats-already-on-my-file",
  };

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function signInAlexDiscoveryEmpty(page: import("@playwright/test").Page) {
  await page.goto("/test-login");
  await page.getByTestId("sign-in-alex-discovery-empty").getByRole("button").click();
  await expect(page).toHaveURL(/\/coach$/);
}

async function sha256File(path: string) {
  const bytes = await readFile(path);
  return createHash("sha256").update(bytes).digest("hex");
}

test.describe.configure({ mode: "serial" });

test.describe("coach first-session starter replies", () => {
  for (const label of COACH_FIRST_SESSION_STARTERS) {
    test(`starter "${label}" returns explain-only answer @375`, async ({
      page,
    }) => {
      await signInAlexDiscoveryEmpty(page);
      await page.getByRole("button", { name: label }).click();
      await expect(page.getByText("Checking this file…")).toBeHidden({
        timeout: 15_000,
      });

      const answer = page.getByTestId("concierge-answer");
      await expect(answer).toBeVisible();
      await expect(answer).toHaveAttribute("data-kind", "answer");
      await expect(answer).toContainText(EXPECTED_SNIPPETS[label]);
      await expect(answer).not.toContainText(/should i|waive|offer more/i);

      const path = `${PROOF_DIR}/starter-${STARTER_SLUGS[label]}-375.png`;
      await page.screenshot({ path, fullPage: false });
    });
  }

  test("starter reply proof PNGs are distinct @375", async () => {
    const paths = COACH_FIRST_SESSION_STARTERS.map(
      (label) => `${PROOF_DIR}/starter-${STARTER_SLUGS[label]}-375.png`,
    );
    const hashes = await Promise.all(paths.map((path) => sha256File(path)));
    expect(new Set(hashes).size).toBe(paths.length);
  });
});
