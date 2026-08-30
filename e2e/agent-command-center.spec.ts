import { expect, test } from "@playwright/test";

import {
  COMMAND_CENTER_CLIENT_COUNT,
  COMMAND_CENTER_EXCEPTION_NAMES,
  SEED_PLAN,
} from "../convex/seedPlan";

test("agent sees eight clients with exceptions first", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Casey Holt" }).click();
  await expect(page).toHaveURL(/\/agent$/);
  await expect(page.getByTestId("app-nav")).toHaveAttribute(
    "data-nav-role",
    "agent",
  );
  await expect(
    page.getByTestId("app-nav").getByRole("link", { name: "Command center" }),
  ).toBeVisible();
  await expect(page.getByTestId("command-center")).toBeVisible();
  await expect(page.getByTestId("command-center-roster")).toBeVisible();
  await expect(page.getByTestId("command-center-priority")).toBeVisible();

  for (const buyer of SEED_PLAN.buyers) {
    const row = page.getByTestId(
      `client-${buyer.name.toLowerCase().replace(/\s+/g, "-")}`,
    );
    await expect(row).toHaveAttribute("data-stage", buyer.stage);
    await expect(row).toContainText(buyer.name);
  }
  await expect(page.locator("[data-testid^='client-']")).toHaveCount(
    COMMAND_CENTER_CLIENT_COUNT,
  );

  await expect(page.getByTestId("priority-1")).toHaveAttribute(
    "data-client-name",
    COMMAND_CENTER_EXCEPTION_NAMES[0],
  );
  await expect(page.getByTestId("priority-2")).toHaveAttribute(
    "data-client-name",
    COMMAND_CENTER_EXCEPTION_NAMES[1],
  );
  await expect(page.getByTestId("priority-1")).toContainText(
    "Missing financing document",
  );
  await expect(page.getByTestId("priority-2")).toContainText(
    "Inspection due tomorrow",
  );
});

test("buyer cannot load the command center", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/agent");
  await expect(page.getByTestId("command-center-denied")).toBeVisible();
  await expect(page.getByTestId("command-center")).toHaveCount(0);
  await expect(page.getByText("Dana Ortiz")).toHaveCount(0);
});

test("vendor cannot load the command center", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
  await page.goto("/agent");
  await expect(page.getByTestId("command-center-denied")).toBeVisible();
  await expect(page.getByTestId("command-center")).toHaveCount(0);
});
