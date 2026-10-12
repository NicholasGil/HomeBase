import { execSync } from "node:child_process";
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Capture demo-followups-3 proof against a production demo build.
 * Run while checked out on the code commit under test (git rev-parse HEAD);
 * commit screenshots/metrics.json in a follow-up proof-only commit so gitSha
 * always points at the code revision that was captured, not the proof commit.
 */
const OUT = path.join(process.cwd(), "proof/demo-followups-3");
const BASE = process.env.PROOF_BASE_URL ?? "http://127.0.0.1:3000";
const VIEWPORT = { width: 375, height: 812 };
async function signInDemoBuyerCoach(page) {
  await page.goto(`${BASE}/demo/enter/buyer-coach`);
  await page.waitForURL(/\/coach$/);
}

async function signInDemoBuyerDiscovery(page) {
  await page.goto(`${BASE}/demo/enter/buyer-discovery`);
  await page.waitForURL(/\/coach$/);
}

/** Scroll the answer into the viewport without resetting coach scroll to 0. */
async function expectAnswerVisibleInViewport(page, answerLocator) {
  await answerLocator.evaluate((el) => {
    el.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await page.waitForFunction(
    (testId) => {
      const el = document.querySelector(`[data-testid="${testId}"]`);
      if (!el) {
        return false;
      }
      const rect = el.getBoundingClientRect();
      const tabBar = document.querySelector('[data-testid="app-tab-bar"]');
      const dock = document.querySelector('[data-testid="concierge-mobile-dock"]');
      const bottomInset = Math.max(
        tabBar ? tabBar.getBoundingClientRect().top : window.innerHeight,
        dock ? dock.getBoundingClientRect().top : 0,
      );
      return (
        rect.height > 0 &&
        rect.top >= 0 &&
        rect.bottom <= bottomInset &&
        el.textContent.trim().length > 0
      );
    },
    "concierge-answer",
    { timeout: 10_000 },
  );
  await page.waitForTimeout(200);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: VIEWPORT,
    hasTouch: true,
    isMobile: true,
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
  const answer = page.getByTestId("concierge-answer");
  await answer.waitFor({ timeout: 20_000 });
  await expectAnswerVisibleInViewport(page, answer);
  await page.screenshot({
    path: path.join(OUT, "more-sheet-starter-answer-375.png"),
    fullPage: false,
  });
  if (await moreSheet.isVisible()) {
    await page.keyboard.press("Escape");
    await moreSheet.waitFor({ state: "hidden" });
  }

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

  const gitSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();

  const metrics = {
    capturedAt: new Date().toISOString(),
    gitSha,
    gitShaNote:
      "Capture-time HEAD (code under test). Proof files are committed separately.",
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
