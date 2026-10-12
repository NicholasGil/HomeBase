import { expect, test } from "../fixtures";

import { DEMO_PERSONA_ENTER } from "../../src/lib/demo-persona-enter";
import { TEST_SESSION_COOKIE } from "../../src/lib/test-session";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

const CHOOSER_PERSONAS: {
  testId: string;
  enterPath: string;
  urlPattern: RegExp;
  assertLanded: (page: import("@playwright/test").Page) => Promise<void>;
}[] = [
  {
    testId: "demo-persona-buyer-coach",
    enterPath: DEMO_PERSONA_ENTER.buyerCoach,
    urlPattern: /\/coach$/,
    async assertLanded(page) {
      await expect(page.getByTestId("demo-shell-badge")).toBeVisible();
      await expect(page.getByTestId("coach-ten-second")).toContainText(
        "814 Maple Ave",
      );
      await expect(page.getByTestId("concierge-mobile-dock")).toBeVisible();
    },
  },
  {
    testId: "demo-persona-buyer-discovery",
    enterPath: DEMO_PERSONA_ENTER.buyerDiscovery,
    urlPattern: /\/coach$/,
    async assertLanded(page) {
      await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
      await expect(page.getByTestId("concierge-scope")).toContainText(
        "Discovery",
      );
      await expect(page.getByTestId("concierge-scope")).toContainText(
        "No property on this file yet",
      );
    },
  },
  {
    testId: "demo-persona-agent",
    enterPath: DEMO_PERSONA_ENTER.agent,
    urlPattern: /\/agent$/,
    async assertLanded(page) {
      await expect(page.getByTestId("command-center")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Command center" })).toBeVisible();
    },
  },
  {
    testId: "demo-persona-vendor",
    enterPath: DEMO_PERSONA_ENTER.vendor,
    urlPattern: /\/vendor$/,
    async assertLanded(page) {
      await expect(page.getByTestId("vendor-portal")).toBeVisible();
      await expect(page.getByTestId("vendor-assignment")).toBeVisible();
    },
  },
  {
    testId: "demo-persona-onboarding",
    enterPath: DEMO_PERSONA_ENTER.onboarding,
    urlPattern: /\/brokerage\/onboarding$/,
    async assertLanded(page) {
      await expect(page.getByTestId("brokerage-onboarding")).toBeVisible();
      await expect(page.getByTestId("brokerage-name-input")).toBeVisible();
    },
  },
];

test("loading /demo alone does not mint hb_test_identity (no prefetch session)", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto("/demo", { waitUntil: "networkidle" });
  await expect(page.getByTestId("demo-persona-chooser")).toBeVisible();
  const cookies = await context.cookies();
  expect(
    cookies.some((cookie) => cookie.name === TEST_SESSION_COOKIE),
  ).toBe(false);
});

test.describe("demo chooser — investor entry path", () => {
  for (const { testId, enterPath, urlPattern, assertLanded } of CHOOSER_PERSONAS) {
    test(`${testId} navigates to ${enterPath} and lands on destination`, async ({
      page,
    }) => {
      await page.goto("/demo");
      await expect(page.getByTestId("demo-persona-chooser")).toBeVisible();
      const card = page.getByTestId(testId);
      await expect(card.getByRole("link")).toHaveAttribute("href", enterPath);
      await card.getByRole("link").click();
      await expect(page).toHaveURL(urlPattern, { timeout: 30_000 });
      await assertLanded(page);
    });
  }
});
