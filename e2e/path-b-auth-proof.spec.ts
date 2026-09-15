import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const proofDir = path.join("proof", "path-b-auth");

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

test.beforeAll(() => {
  fs.mkdirSync(proofDir, { recursive: true });
});

test("path-b proof — sign-in sold path UI @375", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByTestId("sign-in-sold-path-cta")).toBeVisible();
  await page.screenshot({
    path: path.join(proofDir, "sign-in-sold-path-fallback-375.png"),
    fullPage: true,
  });
});

test("path-b proof — pricing continue to sign-up @375", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByTestId("pricing-continue-coach-hero")).toBeVisible();
  await page.screenshot({
    path: path.join(proofDir, "pricing-continue-signed-out-375.png"),
    fullPage: false,
  });
  await page.getByTestId("pricing-continue-coach-hero").click();
  await expect(page).toHaveURL(/\/sign-up$/);
  await page.screenshot({
    path: path.join(proofDir, "pricing-continue-destination-sign-up-375.png"),
    fullPage: true,
  });
});

test("path-b proof — fixture buyer reaches coach @375", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.screenshot({
    path: path.join(proofDir, "fixture-coach-home-375.png"),
    fullPage: true,
  });
});
