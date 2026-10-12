import { expect, test } from "./fixtures";

/** Global page fixture fails on bootstrap parse errors (e.g. Unexpected token catch). */
test("coach @375 loads without inline bootstrap pageerror", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("coach-ten-second")).toBeVisible();
});
