import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

test("pricing proof — $10/mo and locked upsells @375", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.getByTestId("coach-pricing-link").click();
  await expect(page.getByTestId("pricing-coach-price")).toHaveText("$10/mo");
  await expect(page.getByTestId("pricing-continue-coach-hero")).toBeVisible();
  await page.screenshot({
    path: "proof/pricing/pricing-coach-10-hero-cta-above-fold-375.png",
    fullPage: false,
  });
  await page.screenshot({
    path: "proof/pricing/pricing-coach-10-locked-upsells-375.png",
    fullPage: true,
  });
});

test("pricing proof — CTA lands on coach @375", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto("/pricing");
  await page.getByTestId("pricing-continue-coach").click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("coach-home")).toBeVisible();
  await page.screenshot({
    path: "proof/pricing/pricing-cta-coach-home-375.png",
    fullPage: true,
  });
});
