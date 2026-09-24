import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const base = process.env.PROOF_BASE_URL ?? "http://127.0.0.1:3000";
const outDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "proof",
  "brokerage-onboarding",
);

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();

async function mobilePage() {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  return await context.newPage();
}

const page = await mobilePage();

await page.goto(`${base}/test-login`);
await page.screenshot({
  path: path.join(outDir, "c-test-login-taylor-brooks.png"),
  fullPage: true,
});

await page.getByTestId("sign-in-onboarding-agent").click();
await page.waitForURL(/\/brokerage\/onboarding/, { timeout: 15000 });
await page.screenshot({
  path: path.join(outDir, "a-onboarding-create-form.png"),
  fullPage: true,
});

await page.goto(`${base}/brokerage/onboarding?mode=join`);
await page.getByTestId("brokerage-invite-input").waitFor({ timeout: 15000 });
await page.screenshot({
  path: path.join(outDir, "d-onboarding-join-tab.png"),
  fullPage: true,
});

await page.close();

const joinPage = await mobilePage();
await joinPage.goto(`${base}/test-login`);
await joinPage.getByTestId("sign-in-onboarding-agent").click();
await joinPage.waitForURL(/\/brokerage\/onboarding/, { timeout: 15000 });
await joinPage.goto(`${base}/brokerage/onboarding?mode=join`);
await joinPage.getByTestId("brokerage-invite-input").waitFor({ timeout: 15000 });
await joinPage.getByTestId("brokerage-invite-input").fill("LOOKOUT1");
await joinPage.getByTestId("brokerage-join-submit").click();
await joinPage.waitForURL(/\/agent$/, { timeout: 15000 });
await joinPage.screenshot({
  path: path.join(outDir, "e-join-lookout-roster.png"),
  fullPage: true,
});
await joinPage.close();

const createPage = await mobilePage();
await createPage.goto(`${base}/test-login`);
await createPage.getByTestId("sign-in-onboarding-agent").click();
await createPage.getByTestId("brokerage-name-input").fill("Harborline Realty");
await createPage.getByTestId("brokerage-create-submit").click();
await createPage.waitForURL(/\/agent$/, { timeout: 15000 });
await createPage.getByTestId("command-center-copy-invite").click();
await createPage.screenshot({
  path: path.join(outDir, "b-empty-agent-invite-cta.png"),
  fullPage: true,
});
await createPage.close();

await browser.close();
console.log("Saved proofs to", outDir);
