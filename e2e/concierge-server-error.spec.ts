import { expect, test } from "./fixtures";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

test("concierge shows error and re-enables Ask on server failure @375", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByTestId("sign-in-alex-concierge-server-error").click();
  await expect(page).toHaveURL(/\/coach$/);

  await page.getByTestId("concierge-question").fill("What happens next?");
  await page.getByTestId("concierge-ask").click();

  await expect(page.getByTestId("concierge-error")).toBeVisible();
  await expect(page.getByTestId("concierge-error")).toContainText(
    /could not load an answer/i,
  );
  await expect(page.getByTestId("concierge-error-retry")).toBeVisible();
  await expect(page.getByTestId("concierge-ask")).toBeEnabled();
  await expect(page.getByText("Checking this file")).toHaveCount(0);
});
