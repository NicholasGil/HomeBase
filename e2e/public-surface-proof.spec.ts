import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const PROOF_DIR = path.join("proof", "public-surface");
const VIEWPORT = { width: 375, height: 812 };

test.use({
  viewport: VIEWPORT,
  hasTouch: true,
  isMobile: true,
});

test("public surface proof @375 — landing, auth, pricing", async ({ page }) => {
  await mkdir(PROOF_DIR, { recursive: true });

  await page.goto("/");
  await expect(page.getByTestId("marketing-landing")).toBeVisible();
  await expect(page.getByText("P0 foundation")).toHaveCount(0);
  await expect(page.getByText(/DESIGN\.md/i)).toHaveCount(0);
  await expect(page.getByText(/Clerk slice/i)).toHaveCount(0);
  await expect(page.getByText("FLAG_MLS")).toHaveCount(0);
  await expect(page.getByTestId("marketing-cta-sign-up")).toBeVisible();
  await expect(page.getByTestId("marketing-cta-pricing")).toBeVisible();
  await page.screenshot({
    path: path.join(PROOF_DIR, "01-landing-fold-375.png"),
    fullPage: false,
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByText("Your journey, end to end")).toBeVisible();
  await page.screenshot({
    path: path.join(PROOF_DIR, "02-landing-below-fold-375.png"),
    fullPage: false,
  });

  await page.goto("/sign-in");
  await expect(page.getByTestId("sign-in-fixture-fallback")).toBeVisible();
  const notice = page.getByTestId("buyer-auth-env-notice");
  await expect(notice).not.toContainText(/clerk/i);
  const coachLink = page.getByTestId("buyer-auth-coach-link");
  const coachBox = await coachLink.boundingBox();
  expect(coachBox).not.toBeNull();
  expect(coachBox!.height).toBeGreaterThanOrEqual(44);
  expect(coachBox!.width).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: path.join(PROOF_DIR, "03-sign-in-375.png"),
    fullPage: false,
  });

  await page.goto("/sign-up");
  await expect(page.getByTestId("sign-up-fixture-fallback")).toBeVisible();
  await expect(page.getByTestId("buyer-auth-env-notice")).not.toContainText(
    /clerk/i,
  );
  const signUpCoach = page.getByTestId("buyer-auth-coach-link");
  const signUpCoachBox = await signUpCoach.boundingBox();
  expect(signUpCoachBox).not.toBeNull();
  expect(signUpCoachBox!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: path.join(PROOF_DIR, "04-sign-up-375.png"),
    fullPage: false,
  });

  await page.goto("/pricing");
  await expect(page.getByTestId("pricing-page")).toBeVisible();
  await expect(page.getByTestId("pricing-coach-price")).toHaveText("$10/mo");
  await page.screenshot({
    path: path.join(PROOF_DIR, "05-pricing-smoke-375.png"),
    fullPage: false,
  });
});
