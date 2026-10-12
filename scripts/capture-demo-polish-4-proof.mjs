import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const FILE_SESSION_CONCIERGE_STARTERS = [
  "What happens next?",
  "When is my inspection and what should I bring?",
  "What am I missing?",
];

const OUT = path.join(process.cwd(), "proof/demo-polish-4");
const BASE = process.env.PROOF_BASE_URL ?? "http://127.0.0.1:3000";
const VIEWPORT = { width: 375, height: 812 };

async function signInDemoBuyerCoach(page) {
  await page.goto(`${BASE}/demo`);
  await page.getByTestId("demo-persona-buyer-coach").getByRole("button").click();
  await page.waitForURL(/\/coach$/);
}

function askVisible(page) {
  return page.evaluate(() => {
    const ask = document.querySelector('[data-testid="concierge-ask"]');
    const dock = document.querySelector('[data-testid="concierge-mobile-dock"]');
    if (!ask) return false;
    const rect = ask.getBoundingClientRect();
    const tab = document.querySelector('[data-testid="app-tab-bar"]');
    const tabTop = tab?.getBoundingClientRect().top ?? window.innerHeight;
    const inView =
      rect.top >= 0 &&
      rect.bottom <= tabTop &&
      rect.width > 0 &&
      rect.height > 0;
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    const hitAsk =
      hit?.closest('[data-testid="concierge-ask"]') !== null ||
      hit?.getAttribute("data-testid") === "concierge-ask";
    return inView && hitAsk && dock !== null;
  });
}

async function coachCardIsScroller(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[aria-label="Personal coach"]');
    if (!card) return true;
    const style = getComputedStyle(card);
    const scrollable =
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      card.scrollHeight > card.clientHeight + 2;
    return scrollable;
  });
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
  const documentScrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  return {
    path: pagePath,
    documentScrollWidth,
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
  const askVisibleFirstPaint = await askVisible(page);
  const coachCardScrollerAtPaint = await coachCardIsScroller(page);
  await page.screenshot({
    path: path.join(OUT, "coach-first-paint-375.png"),
    fullPage: false,
  });

  const askLatencyMs = {};
  for (const starter of FILE_SESSION_CONCIERGE_STARTERS) {
    await page.goto(`${BASE}/demo`);
    await page.getByTestId("demo-persona-buyer-coach").getByRole("button").click();
    await page.waitForURL(/\/coach$/);
    const chip = page
      .getByLabel("Suggested questions")
      .getByRole("button", { name: starter });
    const start = Date.now();
    await chip.click();
    await page.getByTestId("concierge-answer").waitFor({ timeout: 3000 });
    askLatencyMs[starter] = Date.now() - start;
  }

  await signInDemoBuyerCoach(page);
  await page
    .getByLabel("Suggested questions")
    .getByRole("button", { name: FILE_SESSION_CONCIERGE_STARTERS[0] })
    .click();
  await page.getByTestId("concierge-answer").waitFor();
  const askVisibleAfterAnswer = await askVisible(page);
  await page.screenshot({
    path: path.join(OUT, "coach-after-answer-375.png"),
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
    askVisibleFirstPaint,
    askVisibleAfterAnswer,
    askLatencyMs,
    coachCardIsScroller: coachCardScrollerAtPaint,
    pages: metricsPages,
  };

  await writeFile(
    path.join(OUT, "metrics.json"),
    `${JSON.stringify(metrics, null, 2)}\n`,
  );

  await browser.close();
  console.log(`Wrote proofs under ${OUT}`);
  console.log(JSON.stringify(metrics, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
