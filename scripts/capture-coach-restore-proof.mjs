import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "proof/coach-scroll-restore");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

async function signInAlex(page) {
  await page.goto(`${baseURL}/test-login`);
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await page.waitForURL(/\/coach$/);
  await page.getByTestId("coach-ten-second").waitFor();
}

async function scrollTo(page, y) {
  await page.evaluate((target) => window.scrollTo(0, target), y);
  await page.waitForTimeout(200);
}

async function capture(label, page) {
  const file = path.join(outDir, `${label}-375.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();
const shots = [];

for (const targetY of [90, 387]) {
  await signInAlex(page);
  await scrollTo(page, targetY);
  const savedY = await page.evaluate(() => window.scrollY);

  const tabBar = page.getByTestId("app-tab-bar");
  await tabBar.getByRole("link", { name: "Search" }).evaluate((a) => {
    a.click();
  });
  await page.waitForURL(/\/search/);
  await tabBar.getByRole("link", { name: "Coach", exact: true }).evaluate((a) => {
    a.click();
  });
  await page.waitForURL(/\/coach$/);
  await page.waitForTimeout(400);
  const afterTab = await page.evaluate(() => window.scrollY);
  shots.push({
    targetY,
    savedY,
    afterTab,
    tabReturn: await capture(`y${targetY}-tab-return`, page),
  });

  await page.goto(`${baseURL}/search`);
  await page.waitForURL(/\/search/);
  await page.goto(`${baseURL}/coach`);
  await page.waitForURL(/\/coach$/);
  await page.waitForTimeout(400);
  const afterGoto = await page.evaluate(() => window.scrollY);
  shots.push({
    targetY,
    savedY,
    afterGoto,
    searchThenCoach: await capture(`y${targetY}-search-then-coach`, page),
  });
}

const gitSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
await writeFile(
  path.join(outDir, "metrics.json"),
  JSON.stringify(
    {
      baseURL,
      viewport: { width: 375, height: 812 },
      gitSha,
      shots,
    },
    null,
    2,
  ),
);

await browser.close();
console.log(JSON.stringify(shots, null, 2));
