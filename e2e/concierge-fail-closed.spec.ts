import { expect, test } from "@playwright/test";

const MOBILE = { width: 375, height: 812 };
const UNAVAILABLE_TITLE =
  "AI coach unavailable — model key not configured";

async function signInCoachUnavailable(page: import("@playwright/test").Page) {
  await page.goto("/test-login");
  await page.getByTestId("sign-in-alex-coach-unavailable").click();
  await expect(page).toHaveURL(/\/coach$/);
}

test.describe("concierge fail-closed @375", () => {
  test.use({ viewport: MOBILE, hasTouch: true, isMobile: true });

  test("coach home shows honest unavailable state and disables Ask", async ({
    page,
  }) => {
    await signInCoachUnavailable(page);
    await expect(page.getByTestId("concierge")).toHaveAttribute(
      "data-concierge-availability",
      "model_key_missing",
    );
    await expect(page.getByTestId("concierge-unavailable")).toContainText(
      UNAVAILABLE_TITLE,
    );
    await expect(page.getByTestId("concierge-ask")).toBeDisabled();
    await expect(page.getByTestId("concierge-question")).toBeDisabled();

    const chip = page.getByRole("button", { name: "What happens next?" });
    await expect(chip).toBeDisabled();
  });

  test("sheet chat shows the same unavailable state on vault", async ({
    page,
  }) => {
    await signInCoachUnavailable(page);
    await page.goto("/vault");
    await page.getByTestId("concierge-fab").click();
    await expect(page.getByTestId("concierge-sheet")).toBeVisible();
    await expect(page.getByTestId("concierge-unavailable")).toContainText(
      UNAVAILABLE_TITLE,
    );
    await expect(page.getByTestId("concierge-ask")).toBeDisabled();
  });
});

test("fixture Alex discovery coach still answers when model key is not required", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByTestId("sign-in-alex-discovery-empty").click();
  await expect(page).toHaveURL(/\/coach$/);
  const concierge = page.getByTestId("concierge");
  await concierge.getByRole("button", { name: "What happens next?" }).click();
  const answer = concierge.getByTestId("concierge-answer").first();
  await expect(answer).toHaveAttribute("data-kind", "answer");
  await expect(answer).toContainText("No property is on this file yet");
});
