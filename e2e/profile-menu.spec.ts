import { expect, test } from "@playwright/test";

test("buyer avatar opens profile settings and signs out to fixture login", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByTestId("profile-avatar").click();
  const menu = page.getByTestId("profile-menu");
  await expect(menu).toBeVisible();
  await expect(menu).toContainText("Alex Rivera");
  await expect(menu).toContainText("buyer");

  await menu.getByRole("menuitem", { name: "Profile settings" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByTestId("profile-settings")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await expect(page.getByText("Alex Rivera")).toBeVisible();
  await expect(page.getByText("alex.rivera@example.com")).toBeVisible();
  await expect(page.getByText("256-555-0101")).toBeVisible();
  await expect(page.getByText("buyer")).toBeVisible();

  await page.getByTestId("profile-avatar").click();
  await page.getByTestId("profile-menu").getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/test-login$/);
  await expect(
    page.getByRole("button", { name: "Sign in as Alex Rivera" }),
  ).toBeVisible();
});
