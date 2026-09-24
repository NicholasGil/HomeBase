import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const PROOF_DIR = path.join("proof", "agent-cc-tensec");
const VIEWPORT = { width: 375, height: 812 };

test.use({
  viewport: VIEWPORT,
  hasTouch: true,
  isMobile: true,
});

test.setTimeout(90_000);

async function signInAlex(page: import("@playwright/test").Page) {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
}

/** Fixture transaction RSC can sit behind loading.tsx briefly; proofs need painted copy. */
async function waitForBuyerTransactionHero(
  page: import("@playwright/test").Page,
) {
  await expect(
    page.getByRole("status", { name: "Loading this transaction" }),
  ).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByTestId("ten-second-hero")).toBeVisible();
  await expect(page.getByTestId("ten-second-where")).toHaveText("Inspection");
  await expect(page.getByTestId("ten-second-next")).toContainText(
    "Schedule inspection",
  );
  await expect(page.getByTestId("ten-second-owe")).toContainText("Title company");
  await page.evaluate(() => window.scrollTo(0, 0));
}

test("agent-cc tensec proof @375 — TS-001…003 + ACC-001", async ({ page }) => {
  await mkdir(PROOF_DIR, { recursive: true });

  await signInAlex(page);
  await expect(page.getByTestId("coach-ten-second")).toBeVisible();
  await expect(page.getByTestId("ten-second-where")).toHaveText("Inspection");
  await expect(page.getByTestId("ten-second-next")).toContainText(
    "Schedule inspection",
  );
  await expect(page.getByTestId("ten-second-done")).toContainText(
    "Sign purchase agreement",
  );
  await expect(page.getByTestId("ten-second-waiting")).toContainText("agent");
  await expect(page.getByTestId("ten-second-owe")).toContainText("$450.00");
  await page.screenshot({
    path: path.join(PROOF_DIR, "01-buyer-alex-coach-tensec-375.png"),
    fullPage: false,
  });

  await page.goto("/dashboard");
  await expect(page.getByTestId("locked-upsell-pipeline")).toBeVisible();
  await expect(page.getByText(/ten-second dashboard/i)).toHaveCount(0);
  await page.screenshot({
    path: path.join(PROOF_DIR, "02-buyer-pipeline-lock-375.png"),
    fullPage: false,
  });

  await page.goto("/transactions/seed:buyer-a");
  await waitForBuyerTransactionHero(page);
  await expect(page.getByText("Opened by id")).toHaveCount(0);
  await expect(page.getByText(/seed:buyer/i)).toHaveCount(0);
  await expect(page.getByText("title_issued")).toHaveCount(0);
  await page.screenshot({
    path: path.join(PROOF_DIR, "03-buyer-transaction-clean-375.png"),
    fullPage: false,
  });

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Casey Holt" }).click();
  await expect(page).toHaveURL(/\/agent$/);
  await expect(page.getByTestId("command-center")).toBeVisible();
  await expect(page.getByText(/Fixture session/i)).toHaveCount(0);
  await expect(page.getByText(/not Clerk/i)).toHaveCount(0);
  await page.screenshot({
    path: path.join(PROOF_DIR, "04-agent-cc-roster-375.png"),
    fullPage: false,
  });

  await page.goto("/test-login");
  await page.context().clearCookies();
  await page.getByTestId("sign-in-onboarding-agent").click();
  await expect(page).toHaveURL(/\/brokerage\/onboarding$/);
  await page.getByTestId("brokerage-name-input").fill("Harborline Realty");
  await page.getByTestId("brokerage-create-submit").click();
  await expect(page).toHaveURL(/\/agent$/);
  await expect(page.getByTestId("command-center-empty")).toBeVisible();
  await expect(page.getByText(/MLS search and map keys/i)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /invite code/i }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(PROOF_DIR, "05-agent-empty-invite-375.png"),
    fullPage: false,
  });
});
