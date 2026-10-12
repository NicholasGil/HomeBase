import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "proof/demo-followups-2");
const BASE = process.env.PROOF_BASE_URL ?? "http://127.0.0.1:3000";
const VIEWPORT = { width: 375, height: 812 };
const SCROLL_KEY = "realtyrise.coach.scrollY.v1";

const DEMO_ROUTES = [
  ["home", "/"],
  ["demo", "/demo"],
  ["coach", "/coach"],
  ["vendor", "/vendor"],
  ["agent", "/agent"],
  ["pricing", "/pricing"],
  ["brokerage_onboarding", "/brokerage/onboarding"],
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

async function collectRouteMetrics(context, pagePath) {
  const page = await context.newPage();
  const consoleErrors = [];
  const http4xx = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("response", (res) => {
    const status = res.status();
    if (status >= 400 && status < 500) {
      http4xx.push({ url: res.url(), status });
    }
  });
  await page.goto(`${BASE}${pagePath}`, { waitUntil: "networkidle" });
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  await page.close();
  return {
    path: pagePath,
    scrollWidth,
    consoleErrorCount: consoleErrors.length,
    consoleErrors: consoleErrors.slice(0, 20),
    http4xxCount: http4xx.length,
    http4xx: http4xx.slice(0, 20),
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
  await page.screenshot({
    path: path.join(OUT, "coach-first-paint-375.png"),
    fullPage: false,
  });

  const typedQuestion = "When's my inspection?";
  await page.getByTestId("concierge-question").fill(typedQuestion);
  await page.getByTestId("concierge-ask").click();
  await page.getByTestId("concierge-answer").waitFor({ timeout: 20_000 });
  const dockTopY = await dockTop(page);
  const typedAskSubmits = await page.evaluate((dockY) => {
    const bubble = document.querySelector('[data-testid="concierge-user-question"]');
    const answer = document.querySelector('[data-testid="concierge-answer"]');
    if (!bubble || !answer || dockY === null) return false;
    const bubbleRect = bubble.getBoundingClientRect();
    const answerRect = answer.getBoundingClientRect();
    return (
      bubbleRect.top < answerRect.top &&
      answerRect.bottom <= dockY + 1 &&
      bubbleRect.bottom <= dockY + 1
    );
  }, dockTopY);
  await page.screenshot({
    path: path.join(OUT, "coach-typed-ask-answer-375.png"),
    fullPage: false,
  });

  await signInDemoBuyerCoach(page);
  await page.getByTestId("demo-full-os-teaser").scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await page.screenshot({
    path: path.join(OUT, "coach-full-os-teaser-bottom-375.png"),
    fullPage: false,
  });

  await signInDemoBuyerCoach(page);
  await page.evaluate(() => window.scrollTo(0, 360));
  await page.waitForTimeout(120);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  let backScrollRestoredPopstate = false;
  let noTopFlash = false;
  const txHref = await page.evaluate(() => {
    const link = document.querySelector('a[href^="/transactions/"]');
    return link?.getAttribute("href") ?? null;
  });
  if (txHref) {
    await page.evaluate(
      ({ key, y }) => {
        sessionStorage.setItem(key, String(y));
      },
      { key: SCROLL_KEY, y: scrollBefore },
    );
    await page.goto(`${BASE}${txHref}`);
    await page.waitForURL(/\/transactions\//);
    await page.goBack();
    await page.waitForURL(/\/coach$/);
    await page.waitForTimeout(400);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    backScrollRestoredPopstate =
      scrollBefore > 80 && Math.abs(scrollAfter - scrollBefore) < 48;
    noTopFlash =
      backScrollRestoredPopstate && scrollAfter > 80 && scrollAfter >= scrollBefore - 48;
    await page.screenshot({
      path: path.join(OUT, "coach-after-back-375.png"),
      fullPage: false,
    });
  }

  await signInDemoBuyerCoach(page);
  await page.evaluate(() => window.scrollTo(0, 280));
  await page.waitForTimeout(100);
  const tabScrollBefore = await page.evaluate(() => window.scrollY);
  await page.evaluate(
    ({ key, y }) => {
      sessionStorage.setItem(key, String(y));
    },
    { key: SCROLL_KEY, y: tabScrollBefore },
  );
  await page.goto(`${BASE}/pricing`);
  await page.getByTestId("pricing-continue-coach").click();
  await page.waitForURL(/\/coach$/);
  await page.waitForTimeout(400);
  const tabScrollAfter = await page.evaluate(() => window.scrollY);
  const backScrollRestoredTab =
    tabScrollBefore > 60 && Math.abs(tabScrollAfter - tabScrollBefore) < 48;

  const pages = {};
  for (const [key, route] of DEMO_ROUTES) {
    pages[key] = await collectRouteMetrics(context, route);
  }

  const metrics = {
    capturedAt: new Date().toISOString(),
    viewportWidth: VIEWPORT.width,
    env: {
      VERCEL_ENV: "production",
      REALTYRISE_DEMO_MODE: "1",
    },
    typedAskSubmits,
    backScrollRestoredPopstate,
    backScrollRestoredTab,
    noTopFlash,
    pages,
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
