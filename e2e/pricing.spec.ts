import { expect, test } from "@playwright/test";

import { BUYER_LOCKED_OS_PAYMENT_DISCLAIMER } from "../src/lib/buyer-shell";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

test("pricing page shows $10/mo coach entry and locked OS upsells", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(page.getByTestId("pricing-page")).toBeVisible();
  await expect(page.getByTestId("pricing-coach-price")).toHaveText("$10/mo");
  await expect(page.getByText("Personal coach entry")).toBeVisible();

  for (const area of ["search", "tours", "pipeline", "vault"]) {
    await expect(page.getByTestId(`locked-upsell-${area}`)).toBeVisible();
  }
  await expect(page.getByTestId("pricing-locked-os-disclaimer")).toHaveText(
    BUYER_LOCKED_OS_PAYMENT_DISCLAIMER,
  );
  await expect(
    page.getByText(BUYER_LOCKED_OS_PAYMENT_DISCLAIMER, { exact: true }),
  ).toHaveCount(1);

  const html = await page.content();
  expect(html.toLowerCase()).not.toContain("stripe");
  expect(html.toLowerCase()).not.toContain("checkout.session");
});

test("pricing CTA returns to coach without payment UI", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  const pricingLink = page.getByTestId("coach-pricing-link");
  const linkBox = await pricingLink.boundingBox();
  expect(linkBox).not.toBeNull();
  expect(linkBox!.height).toBeGreaterThanOrEqual(44);

  await pricingLink.click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByTestId("pricing-billing-disclaimer")).toContainText(
    /no payment/i,
  );

  await page.getByTestId("pricing-continue-coach").click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByTestId("concierge")).toBeVisible();
});
