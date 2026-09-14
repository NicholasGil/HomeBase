import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

test("sign-in fixture fallback @375 points at test-login", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByTestId("sign-in-fixture-fallback")).toBeVisible();
  const cta = page.getByTestId("sign-in-fixture-fallback-cta");
  const box = await cta.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await cta.click();
  await expect(page).toHaveURL(/\/test-login$/);
});

test("fixture login still lands on coach", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("coach-home")).toBeVisible();
});

// Live Clerk sign-up → coach requires Preview/production Clerk + Convex keys (needs-human #1).
