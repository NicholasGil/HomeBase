import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "proof/coach-scroll-restore");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const deviceScaleFactor = Number(process.env.PROOF_DEVICE_SCALE_FACTOR ?? "2");

async function enterDemoBuyerCoach(page) {
  await page.goto(`${baseURL}/demo/enter/buyer-coach`);
  await page.waitForURL(/\/coach$/);
  await page.getByTestId("coach-ten-second").waitFor();
}

async function scrollTo(page, y) {
  await page.evaluate((target) => window.scrollTo(0, target), y);
  await page.waitForFunction(
    (min) => window.scrollY >= min - 15,
    y >= 300 ? 280 : 60,
  );
}

async function capture(label, page) {
  const file = path.join(outDir, `${label}-375.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function waitScrollNear(page, expectedY, tolerance = 10) {
  await page.waitForFunction(
    ({ y, tol }) => Math.abs(window.scrollY - y) <= tol,
    { y: expectedY, tol: tolerance },
    { timeout: 4000 },
  );
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();
const shots = [];

for (const targetY of [90, 387]) {
  await enterDemoBuyerCoach(page);
  await scrollTo(page, targetY);
  const savedY = await page.evaluate(() => window.scrollY);

  const tabBar = page.getByTestId("app-tab-bar");
  await tabBar.getByRole("link", { name: "Search" }).click();
  await page.waitForURL(/\/search/);
  await tabBar.getByRole("link", { name: "Coach", exact: true }).click();
  await page.waitForURL(/\/coach$/);
  await page.getByTestId("coach-ten-second").waitFor();
  await waitScrollNear(page, savedY, targetY >= 300 ? 10 : 15);
  const afterTab = await page.evaluate(() => window.scrollY);
  shots.push({
    targetY,
    savedY,
    afterTab,
    tabReturn: await capture(`y${targetY}-tab-return`, page),
  });

  await enterDemoBuyerCoach(page);
  await scrollTo(page, targetY);
  const savedY2 = await page.evaluate(() => window.scrollY);
  const tabBar2 = page.getByTestId("app-tab-bar");
  await tabBar2.getByRole("link", { name: "Search" }).click();
  await page.waitForURL(/\/search/);
  await page.waitForFunction(() => window.location.pathname.startsWith("/search"));
  const onSearchShot = await capture(`y${targetY}-search-then-coach`, page);
  await tabBar2.getByRole("link", { name: "Coach", exact: true }).click();
  await page.waitForURL(/\/coach$/);
  await waitScrollNear(page, savedY2, targetY >= 300 ? 10 : 15);
  const afterSearchThenCoach = await page.evaluate(() => window.scrollY);
  shots.push({
    targetY,
    savedY: savedY2,
    afterSearchThenCoach,
    searchThenCoach: onSearchShot,
    searchThenCoachCoachScrollY: afterSearchThenCoach,
  });
}

await enterDemoBuyerCoach(page);
await page.getByTestId("ten-second-next").getByRole("link").click();
await page.waitForURL(/\/transactions\//);
const savedTxnY = await page.evaluate(() => {
  const target = Math.min(
    1095,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  window.scrollTo(0, target);
  return window.scrollY;
});
await page
  .getByTestId("app-tab-bar")
  .getByRole("link", { name: "Coach", exact: true })
  .click();
await page.waitForURL(/\/coach$/);
await page.getByTestId("ten-second-next").getByRole("link").click();
await page.waitForURL(/\/transactions\//);
await page.waitForFunction(() => window.scrollY <= 4);
await capture("txn-redrill-top-pin", page);
await page.goBack();
await page.waitForURL(/\/coach$/);
await page.goBack();
await page.waitForURL(/\/transactions\//);
await waitScrollNear(page, savedTxnY, 10);
await capture("txn-history-back-depth", page);

const gitSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
await writeFile(
  path.join(outDir, "metrics.json"),
  JSON.stringify(
    {
      baseURL,
      viewport: { width: 375, height: 812 },
      deviceScaleFactor,
      gitSha,
      shots,
      txnProof: {
        redrillTopPin: path.join(outDir, "txn-redrill-top-pin-375.png"),
        historyBackDepth: path.join(outDir, "txn-history-back-depth-375.png"),
      },
    },
    null,
    2,
  ),
);

await browser.close();
console.log(JSON.stringify({ gitSha, deviceScaleFactor, shots }, null, 2));
