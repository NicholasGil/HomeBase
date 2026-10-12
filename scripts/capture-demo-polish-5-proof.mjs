import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "proof/demo-polish-5");
const BASE = process.env.PROOF_BASE_URL ?? "http://127.0.0.1:3000";
const VIEWPORT = { width: 375, height: 812 };

const STARTERS = [
  "What happens next?",
  "When's my inspection?",
  "What am I missing?",
];

async function signInDemoBuyerCoach(page) {
  await page.goto(`${BASE}/demo`);
  await page.getByTestId("demo-persona-buyer-coach").getByRole("button").click();
  await page.waitForURL(/\/coach$/);
}

function dockTop(page) {
  return page.evaluate(() => {
    const dock = document.querySelector('[data-testid="concierge-mobile-dock"]');
    return dock?.getBoundingClientRect().top ?? null;
  });
}

async function answerReadable(page) {
  const top = await dockTop(page);
  if (top === null) return false;
  return page.evaluate((dockTopY) => {
    const answer = document.querySelector('[data-testid="concierge-answer"]');
    if (!answer) return false;
    const rect = answer.getBoundingClientRect();
    return rect.bottom <= dockTopY + 1;
  }, top);
}

async function chipLabelsUnclipped(page) {
  return page.evaluate(() => {
    const row = document.querySelector('[aria-label="Suggested questions"]');
    if (!row) return false;
    if (row.scrollLeft !== 0) return false;
    const buttons = row.querySelectorAll("button");
    for (const button of buttons) {
      const text = button.textContent?.trim() ?? "";
      if (!text.startsWith("What") && !text.startsWith("When")) {
        return false;
      }
      if (button.scrollWidth > button.clientWidth + 2) {
        return false;
      }
    }
    return true;
  });
}

async function lastContentClearsDock(page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(150);
  const top = await dockTop(page);
  if (top === null) return false;
  return page.evaluate((dockTopY) => {
    const card = document.querySelector('[aria-label="Personal coach"]');
    if (!card) return false;
    const rect = card.getBoundingClientRect();
    return rect.bottom <= dockTopY + 2;
  }, top);
}

async function collectPageMetrics(page, pagePath) {
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  const failedRequests = [];
  page.on("requestfailed", (req) => {
    const errorText = req.failure()?.errorText ?? "failed";
    if (errorText === "net::ERR_ABORTED") return;
    failedRequests.push(`${errorText} ${req.url()}`);
  });
  await page.goto(`${BASE}${pagePath}`, { waitUntil: "networkidle" });
  return {
    path: pagePath,
    documentScrollWidth: await page.evaluate(
      () => document.documentElement.scrollWidth,
    ),
    consoleErrorCount: consoleErrors.length,
    consoleErrors: consoleErrors.slice(0, 20),
    failedRequestCount: failedRequests.length,
    failedRequests: failedRequests.slice(0, 20),
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: VIEWPORT,
  });
  const page = await context.newPage();

  await signInDemoBuyerCoach(page);
  await page.getByTestId("concierge-mobile-dock").waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  const nextVisible = await page.evaluate(() => {
    const next = document.querySelector('[data-testid="ten-second-next"]');
    const dock = document.querySelector('[data-testid="concierge-mobile-dock"]');
    if (!next || !dock) return false;
    const nextRect = next.getBoundingClientRect();
    const dockTop = dock.getBoundingClientRect().top;
    return nextRect.bottom <= dockTop && nextRect.top >= 0;
  });
  if (!nextVisible) {
    console.warn("WARN: ten-second-next not fully above dock at first paint");
  }
  await page.screenshot({
    path: path.join(OUT, "coach-first-paint-375.png"),
    fullPage: false,
  });

  await page
    .getByLabel("Suggested questions")
    .getByRole("button", { name: STARTERS[0] })
    .click();
  await page.getByTestId("concierge-answer").waitFor();
  const answerReadableAfter = await answerReadable(page);
  await page.screenshot({
    path: path.join(OUT, "coach-after-answer-375.png"),
    fullPage: false,
  });

  await signInDemoBuyerCoach(page);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(150);
  const clearsDock = await lastContentClearsDock(page);
  await page.screenshot({
    path: path.join(OUT, "coach-bottom-375.png"),
    fullPage: false,
  });

  await page.goto(
    `${BASE}/demo/enter/buyer-coach?simulateConciergeServerError=1`,
  );
  await page.waitForURL(/\/coach$/);
  await page.getByTestId("concierge-question").fill("What happens next?");
  await page.getByTestId("concierge-ask").click();
  await page.getByTestId("concierge-error").waitFor();
  await page.screenshot({
    path: path.join(OUT, "coach-error-375.png"),
    fullPage: false,
  });

  await signInDemoBuyerCoach(page);
  await page.evaluate(() => window.scrollTo(0, 320));
  await page.waitForTimeout(100);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  let backScrollRestored = false;
  const txHref = await page.evaluate(() => {
    const link = document.querySelector('a[href^="/transactions/"]');
    return link?.getAttribute("href") ?? null;
  });
  if (txHref) {
    await page.evaluate((y) => {
      sessionStorage.setItem("realtyrise.coach.scrollY.v1", String(y));
    }, scrollBefore);
    await page.goto(`${BASE}${txHref}`);
    await page.waitForURL(/\/transactions\//);
    await page.goBack();
    await page.waitForURL(/\/coach$/);
    await page.waitForTimeout(500);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    backScrollRestored =
      scrollBefore > 80 && Math.abs(scrollAfter - scrollBefore) < 48;
  }

  const chipsOk = await chipLabelsUnclipped(page);

  const metricsPages = {};
  for (const [key, pagePath] of [
    ["home", "/"],
    ["demo", "/demo"],
    ["coach", "/coach"],
    ["vendor", "/vendor"],
    ["agent", "/agent"],
    ["pricing", "/pricing"],
    ["brokerage_onboarding", "/brokerage/onboarding"],
  ]) {
    const metricsPage = await context.newPage();
    metricsPages[key] = await collectPageMetrics(metricsPage, pagePath);
    await metricsPage.close();
  }

  const metrics = {
    capturedAt: new Date().toISOString(),
    viewportWidth: VIEWPORT.width,
    env: {
      VERCEL_ENV: "production",
      REALTYRISE_DEMO_MODE: "1",
    },
    answerReadable: answerReadableAfter,
    lastContentClearsDock: clearsDock,
    chipLabelsUnclipped: chipsOk,
    backScrollRestored,
    pages: metricsPages,
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
