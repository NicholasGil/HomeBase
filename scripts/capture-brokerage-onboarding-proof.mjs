import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const base = process.env.PROOF_BASE_URL ?? "http://localhost:3000";
const outDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "proof",
  "brokerage-onboarding",
);

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

await page.goto(`${base}/test-login`);
await page.screenshot({
  path: path.join(outDir, "c-test-login-onboarding-agent.png"),
  fullPage: true,
});

await page.getByTestId("sign-in-onboarding-agent").click();
await page.waitForURL(/\/brokerage\/onboarding/, { timeout: 15000 });
await page.screenshot({
  path: path.join(outDir, "a-onboarding-create-brokerage.png"),
  fullPage: true,
});

await page.getByTestId("brokerage-name-input").fill("Harborline Realty");
await page.getByTestId("brokerage-create-submit").click();
await page.waitForURL(/\/agent$/, { timeout: 15000 });
await page.screenshot({
  path: path.join(outDir, "b-empty-agent-command-center.png"),
  fullPage: true,
});

await browser.close();
console.log("Saved proofs to", outDir);
