import { expect, test } from "@playwright/test";

import { DEMO_PERSONA_ENTER } from "../../src/lib/demo-persona-enter";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

const CHOOSER_PERSONAS: {
  testId: string;
  enterPath: string;
  urlPattern: RegExp;
}[] = [
  {
    testId: "demo-persona-buyer-coach",
    enterPath: DEMO_PERSONA_ENTER.buyerCoach,
    urlPattern: /\/coach$/,
  },
  {
    testId: "demo-persona-buyer-discovery",
    enterPath: DEMO_PERSONA_ENTER.buyerDiscovery,
    urlPattern: /\/coach$/,
  },
  {
    testId: "demo-persona-agent",
    enterPath: DEMO_PERSONA_ENTER.agent,
    urlPattern: /\/agent$/,
  },
  {
    testId: "demo-persona-vendor",
    enterPath: DEMO_PERSONA_ENTER.vendor,
    urlPattern: /\/vendor$/,
  },
  {
    testId: "demo-persona-onboarding",
    enterPath: DEMO_PERSONA_ENTER.onboarding,
    urlPattern: /\/brokerage\/onboarding$/,
  },
];

test.describe("demo chooser — investor entry path", () => {
  for (const { testId, enterPath, urlPattern } of CHOOSER_PERSONAS) {
    test(`${testId} navigates to ${enterPath} and lands on destination`, async ({
      page,
    }) => {
      await page.goto("/demo");
      await expect(page.getByTestId("demo-persona-chooser")).toBeVisible();
      const card = page.getByTestId(testId);
      await expect(card.getByRole("link")).toHaveAttribute("href", enterPath);
      await card.getByRole("link").click();
      await expect(page).toHaveURL(urlPattern, { timeout: 30_000 });
    });
  }
});
