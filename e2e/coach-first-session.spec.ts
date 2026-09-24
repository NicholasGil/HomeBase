import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const FIRST_SESSION_STARTERS = [
  "What happens next?",
  "What am I missing for this stage?",
  "What's already on my file?",
] as const;

const PROOF_DIR = "proof/coach-first-session";

const PROOF_PATHS = {
  starters: `${PROOF_DIR}/empty-coach-three-starters-375.png`,
  scrollEnd: `${PROOF_DIR}/chips-clear-above-ask-375.png`,
  discoveryFold: `${PROOF_DIR}/empty-discovery-fold-375.png`,
  starterExpanded: (slug: string) =>
    `${PROOF_DIR}/starter-${slug}-expanded-375.png`,
} as const;

const STARTER_SLUGS: Record<(typeof FIRST_SESSION_STARTERS)[number], string> =
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

function conciergeScrollRegion(page: import("@playwright/test").Page) {
  return page
    .locator('[data-testid="concierge"] > div.overflow-y-auto')
    .first();
}

async function sha256File(path: string) {
  const bytes = await readFile(path);
  return createHash("sha256").update(bytes).digest("hex");
}

async function expectDistinctProofHashes(paths: string[]) {
  const hashes = await Promise.all(paths.map((path) => sha256File(path)));
  const unique = new Set(hashes);
  expect(unique.size).toBe(paths.length);
  expect(new Set(paths).size).toBe(paths.length);
}

test("empty Discovery coach shows empty state and three starters @375", async ({
  page,
}) => {
  await signInAlexDiscoveryEmpty(page);
  await expect(page.getByTestId("coach-home")).toBeVisible();
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  await expect(page.getByTestId("concierge-scope")).toContainText(
    "No property on this file yet",
  );
  await expect(page.getByTestId("concierge-scope")).toContainText("Discovery");

  const chips = page.getByLabel("Suggested questions").getByRole("button");
  await expect(chips).toHaveCount(3);
  for (const label of FIRST_SESSION_STARTERS) {
    await expect(page.getByRole("button", { name: label })).toBeVisible();
  }
  for (const chip of await chips.all()) {
    const box = await chip.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box!.height)).toBeGreaterThanOrEqual(44);
  }

  await expect(page.getByTestId("locked-upsell-rail")).toBeVisible();
  await expect(page.getByTestId("locked-upsell-rail-summary")).toBeVisible();
});

test("first-session chips clear sticky Ask at scroll end @375", async ({
  page,
}) => {
  await signInAlexDiscoveryEmpty(page);

  const scroll = conciergeScrollRegion(page);
  await scroll.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });

  const compose = page.getByTestId("concierge-compose");

  const composeBox = await compose.boundingBox();
  expect(composeBox).not.toBeNull();

  for (const label of FIRST_SESSION_STARTERS) {
    const chip = page.getByRole("button", { name: label });
    const chipBox = await chip.boundingBox();
    expect(chipBox).not.toBeNull();
    expect(chipBox!.y + chipBox!.height).toBeLessThanOrEqual(
      composeBox!.y + 1,
    );
  }
});

test("coach first-session proof screenshots @375", async ({ page }) => {
  await signInAlexDiscoveryEmpty(page);

  const scroll = conciergeScrollRegion(page);
  await scroll.evaluate((el) => {
    el.scrollTop = 0;
  });

  const scope = page.getByTestId("concierge-scope");
  const empty = page.getByTestId("coach-first-session-empty");
  await expect(scope).toContainText("Discovery");
  await expect(page.getByTestId("coach-pricing-link")).toContainText("$10");

  const scopeBox = await scope.boundingBox();
  const emptyBox = await empty.boundingBox();
  expect(scopeBox).not.toBeNull();
  expect(emptyBox).not.toBeNull();

  await page.screenshot({
    path: PROOF_PATHS.discoveryFold,
    clip: {
      x: 0,
      y: Math.max(0, scopeBox!.y - 4),
      width: 375,
      height: Math.min(
        812 - Math.max(0, scopeBox!.y - 4),
        emptyBox!.y + emptyBox!.height - scopeBox!.y + 16,
      ),
    },
  });

  for (const label of FIRST_SESSION_STARTERS) {
    await expect(page.getByRole("button", { name: label })).toBeVisible();
  }

  await page.screenshot({
    path: PROOF_PATHS.starters,
    fullPage: false,
  });

  await scroll.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(page.getByTestId("concierge-compose")).toBeVisible();

  const lastChip = page.getByRole("button", {
    name: FIRST_SESSION_STARTERS[2],
  });
  const lastChipBox = await lastChip.boundingBox();
  const composeBox = await page.getByTestId("concierge-compose").boundingBox();
  expect(lastChipBox).not.toBeNull();
  expect(composeBox).not.toBeNull();
  expect(lastChipBox!.y + lastChipBox!.height).toBeLessThanOrEqual(
    composeBox!.y + 1,
  );

  await page.screenshot({
    path: PROOF_PATHS.scrollEnd,
    clip: {
      x: 0,
      y: Math.max(0, composeBox!.y - 168),
      width: 375,
      height: Math.min(812, composeBox!.y + composeBox!.height + 8 - Math.max(0, composeBox!.y - 168)),
    },
  });

  const expandedPaths: string[] = [];
  for (const label of FIRST_SESSION_STARTERS) {
    await signInAlexDiscoveryEmpty(page);
    await page.getByRole("button", { name: label }).click();
    await expect(
      page
        .getByTestId("concierge-first-session-thread")
        .getByTestId("concierge-answer"),
    ).toHaveAttribute("data-kind", "answer", { timeout: 15_000 });
    const path = PROOF_PATHS.starterExpanded(STARTER_SLUGS[label]);
    expandedPaths.push(path);
    await page.screenshot({ path, fullPage: false });
  }

  const allPaths = [
    PROOF_PATHS.discoveryFold,
    PROOF_PATHS.starters,
    PROOF_PATHS.scrollEnd,
    ...expandedPaths,
  ];
  await expectDistinctProofHashes(allPaths);

  const startersHash = await sha256File(PROOF_PATHS.starters);
  const scrollEndHash = await sha256File(PROOF_PATHS.scrollEnd);
  expect(startersHash).not.toEqual(scrollEndHash);
});
