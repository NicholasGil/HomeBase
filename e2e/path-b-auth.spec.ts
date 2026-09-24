import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

test("sign-in product fallback prefers sign-up sold path @375", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByTestId("sign-in-fixture-fallback")).toBeVisible();
  const soldCta = page.getByTestId("sign-in-sold-path-cta");
  const box = await soldCta.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await soldCta.click();
  await expect(page).toHaveURL(/\/sign-up$/);
});

test("marketing landing exposes guest CTAs @375", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("marketing-cta-sign-up")).toBeVisible();
  const pricing = page.getByTestId("marketing-cta-pricing");
  const box = await pricing.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await pricing.click();
  await expect(page).toHaveURL(/\/pricing$/);
});

test("sign-in preview fixture reaches test-login", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByTestId("sign-in-preview-fixture-cta").click();
  await expect(page).toHaveURL(/\/test-login$/);
});

test("pricing continue when signed out routes to sign-up", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByTestId("pricing-continue-coach").click();
  await expect(page).toHaveURL(/\/sign-up$/);
});

test("fixture login still lands on coach", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("coach-home")).toBeVisible();
});

// Live Clerk sign-up → coach requires Preview/production Clerk + Convex keys (needs-human #1).
