import { expect, test } from "@playwright/test";

test("concierge answers a seed question and refuses another client", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page.getByTestId("concierge")).toBeVisible();

  await page.getByRole("button", { name: "What happens next?" }).click();
  await expect(page.getByTestId("concierge-answer")).toContainText(
    "Schedule inspection",
  );

  await page.getByTestId("concierge-question").fill(
    "What happens next on Blair Chen's file?",
  );
  await page.getByRole("button", { name: "Ask" }).click();
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "refuse",
  );
  await expect(page.getByTestId("concierge-answer")).toContainText(
    "another client's file",
  );
  await expect(page.getByTestId("concierge-answer")).not.toContainText("$");
});
