import { execSync } from "node:child_process";
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "proof/demo-followups-3");
const BASE = process.env.PROOF_BASE_URL ?? "http://127.0.0.1:3000";
const VIEWPORT = { width: 375, height: 812 };
const SCROLL_KEY_PREFIX = "realtyrise.coach.scrollY.v1";

async function coachScrollStorageKey(page) {
  return page.evaluate(
    (prefix) => `${prefix}:/coach`,
    SCROLL_KEY_PREFIX,
  );
}

async function signInDemoBuyerCoach(page) {
  await page.goto(`${BASE}/demo/enter/buyer-coach`);
  await page.waitForURL(/\/coach$/);
}

async function signInDemoBuyerDiscovery(page) {
  await page.goto(`${BASE}/demo/enter/buyer-discovery`);
  await page.waitForURL(/\/coach$/);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: VIEWPORT,
  });
  const page = await context.newPage();
  let moreSheetStarterLabel = null;

  await signInDemoBuyerDiscovery(page);
  await page.getByTestId("concierge-mobile-dock").waitFor();
  await page.screenshot({
    path: path.join(OUT, "discovery-first-paint-375.png"),
    fullPage: false,
  });

  await page.getByRole("button", { name: "What's next?" }).click();
  await page.getByTestId("concierge-answer").waitFor({ timeout: 20_000 });
  await page.screenshot({
    path: path.join(OUT, "discovery-after-ask-375.png"),
    fullPage: false,
  });

  await page.goto(`${BASE}/dashboard`);
  await page.goto(`${BASE}/coach`);
  await page.getByTestId("coach-daily-check-in").waitFor();
  await page.screenshot({
    path: path.join(OUT, "discovery-return-check-in-375.png"),
    fullPage: false,
  });

  await signInDemoBuyerCoach(page);
  await page.getByTestId("concierge-mobile-dock").waitFor();
  await page.screenshot({
    path: path.join(OUT, "file-dock-375.png"),
    fullPage: false,
  });

  await page.getByTestId("concierge-more-starters").click();
  const moreSheet = page.getByTestId("concierge-more-starters-sheet");
  await moreSheet.waitFor();
  await page.waitForTimeout(450);
  await page.screenshot({
    path: path.join(OUT, "more-sheet-open-375.png"),
    fullPage: false,
  });
  const moreStarter = await moreSheet.getByRole("button").first();
  moreSheetStarterLabel = (await moreStarter.innerText()).trim();
  await moreStarter.click();
  await page.getByTestId("concierge-answer").waitFor({ timeout: 20_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(OUT, "more-sheet-starter-answer-375.png"),
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await moreSheet.waitFor({ state: "hidden" });

  await page
    .getByTestId("concierge-mobile-dock")
    .getByRole("button", { name: "What's next?" })
    .click();
  await page.getByTestId("concierge-answer").waitFor({ timeout: 20_000 });
  await page.goto(`${BASE}/pricing`);
  await page.getByTestId("pricing-continue-coach").click();
  await page.waitForURL(/\/coach$/);
  await page.getByTestId("coach-daily-check-in").waitFor();
  await page.screenshot({
    path: path.join(OUT, "file-return-check-in-375.png"),
    fullPage: false,
  });

  await context.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await signInDemoBuyerCoach(page);
  await page.getByTestId("coach-ten-second").waitFor({ state: "visible" });
  await page.evaluate(() => window.scrollTo(0, 387));
  await page.waitForFunction(() => window.scrollY >= 300);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  let backScrollRestored = false;
  const txLink = page.getByTestId("ten-second-next").getByRole("link");
  if (await txLink.count()) {
    await txLink.click();
    await page.waitForURL(/\/transactions\//);
    await page.goBack();
    await page.waitForURL(/\/coach$/);
    let scrollAfter = 0;
    const restoreDeadline = Date.now() + 2000;
    while (Date.now() < restoreDeadline) {
      scrollAfter = await page.evaluate(() => window.scrollY);
      if (scrollAfter >= 300) {
        break;
      }
      await page.waitForTimeout(50);
    }
    backScrollRestored =
      scrollBefore >= 300 &&
      scrollAfter >= 300 &&
      Math.abs(scrollAfter - scrollBefore) < 48;
    await page.evaluate((y) => {
      window.scrollTo(0, Math.max(0, y - 120));
    }, scrollAfter);
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(OUT, "back-from-transaction-scroll-375.png"),
      fullPage: false,
    });
  }

  const gitSha =
    process.env.PROOF_GIT_SHA ??
    execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();

  const metrics = {
    capturedAt: new Date().toISOString(),
    gitSha,
    viewportWidth: VIEWPORT.width,
    env: {
      VERCEL_ENV: "production",
      REALTYRISE_DEMO_MODE: "1",
    },
    backScrollRestored,
    moreSheetStarterLabel,
    proofDir: "proof/demo-followups-3",
  };

  await writeFile(
    path.join(OUT, "metrics.json"),
    `${JSON.stringify(metrics, null, 2)}\n`,
  );

  await browser.close();
  console.log(JSON.stringify(metrics, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
