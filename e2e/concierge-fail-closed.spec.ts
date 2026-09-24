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
    const unavailable = page.getByTestId("concierge-unavailable");
    await expect(unavailable).toBeVisible();
    await expect(unavailable).toContainText(UNAVAILABLE_TITLE);
    await expect(
      page.getByLabel("Suggested questions"),
    ).toHaveCount(0);
    await expect(page.getByTestId("concierge-ask")).toBeDisabled();
    await expect(page.getByTestId("concierge-question")).toHaveCount(0);
  });

  test("sheet chat shows the same unavailable state on vault", async ({
    page,
  }) => {
    await signInCoachUnavailable(page);
    await page.goto("/vault");
    await page.getByTestId("concierge-fab").click();
    const sheet = page.getByTestId("concierge-sheet");
    await expect(sheet).toBeVisible();
    const unavailable = sheet.getByTestId("concierge-unavailable");
    await expect(unavailable).toBeVisible();
    await expect(unavailable).toContainText(UNAVAILABLE_TITLE);
    await expect(sheet.getByLabel("Suggested questions")).toHaveCount(0);
    await expect(sheet.getByTestId("concierge-ask")).toBeDisabled();
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
