import { expect, test } from "@playwright/test";

test("Ask my agent routes the section to the licensee thread", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/offers");
  await expect(page.getByTestId("contract-explainer")).toBeVisible();
  await expect(page.getByTestId("explainer-section-earnest-money")).toContainText(
    "This section states",
  );
  await expect(
    page.getByTestId("explainer-section-earnest-money").getByRole("button", {
      name: "Ask my agent",
    }),
  ).toBeVisible();

  await page.getByTestId("ask-agent-earnest-money").click();
  await expect(page.getByTestId("agent-thread-earnest-money")).toContainText(
    "Earnest money",
  );
  await expect(page.getByTestId("agent-thread-earnest-money")).toContainText(
    "This section states",
  );
});
