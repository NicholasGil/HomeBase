import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "proof/demo-polish-3");
const BASE = process.env.PROOF_BASE_URL ?? "http://127.0.0.1:3000";
const VIEWPORT = { width: 375, height: 812 };

async function signInDemo(page, testId) {
  await page.goto(`${BASE}/demo`);
  await page.getByTestId(testId).getByRole("button").click();
}

async function collectPageMetrics(page, pagePath) {
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  const failedRequests = [];
  page.on("requestfailed", (req) => {
    const errorText = req.failure()?.errorText ?? "failed";
    if (errorText === "net::ERR_ABORTED") {
      return;
    }
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

async function askHitTestAtCenter(page) {
  const ask = page.getByTestId("concierge-ask");
  await ask.waitFor({ state: "visible" });
  const box = await ask.boundingBox();
  if (!box) {
    throw new Error("concierge-ask has no bounding box");
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  return page.evaluate(
    ({ px, py }) => {
      const el = document.elementFromPoint(px, py);
      if (!el) return null;
      const tagged = el.closest("[data-testid]");
      if (tagged) {
        return tagged.getAttribute("data-testid");
      }
      return el.tagName.toLowerCase();
    },
    { px: x, py: y },
  );
}

async function scrollCoachAskIntoView(page) {
  for (let step = 0; step < 24; step += 1) {
    const settled = await page.evaluate(() => {
      const ask = document.querySelector('[data-testid="concierge-ask"]');
      const chips = document.querySelector('[aria-label="Suggested questions"]');
      const card = document.querySelector('[aria-label="Personal coach"]');
      const tabBar = document.querySelector('[data-testid="app-tab-bar"]');
      if (!ask || !card) return true;

      const topEdge = card.getBoundingClientRect().top;
      const safeBottom =
        (tabBar?.getBoundingClientRect().top ?? window.innerHeight) - 8;
      const chipsRect = chips?.getBoundingClientRect();
      const askRect = ask.getBoundingClientRect();

      let delta = 0;
      if (chipsRect && chipsRect.top < topEdge + 4) {
        delta = Math.max(delta, topEdge + 4 - chipsRect.top);
      }
      if (askRect.bottom > safeBottom) {
        delta = Math.max(delta, askRect.bottom - safeBottom);
      }
      if (delta <= 0) {
        return true;
      }

      const remaining = card.scrollHeight - card.clientHeight - card.scrollTop;
      if (remaining <= 0) {
        return true;
      }
      card.scrollTop += Math.min(remaining, delta);
      return false;
    });
    if (settled) {
      break;
    }
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: VIEWPORT,
  });
  const page = await context.newPage();

  await signInDemo(page, "demo-persona-buyer-coach");
  await page.waitForURL(/\/coach$/);
  await page.getByTestId("coach-ten-second").waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(OUT, "coach-alex-375.png"),
    fullPage: false,
  });

  await scrollCoachAskIntoView(page);
  const askHitTest = await askHitTestAtCenter(page);
  await page.screenshot({
    path: path.join(OUT, "coach-ask-375.png"),
    fullPage: false,
  });

  await signInDemo(page, "demo-persona-agent");
  await page.waitForURL(/\/agent$/);
  await page
    .getByTestId("app-tab-bar")
    .getByRole("link", { name: "Command" })
    .click();
  await page.getByTestId("command-center").waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(OUT, "agent-casey-375.png"),
    fullPage: false,
  });

  await page.goto(`${BASE}/pricing`);
  await page.getByTestId("pricing-page").waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(OUT, "pricing-375.png"),
    fullPage: false,
  });

  await signInDemo(page, "demo-persona-vendor");
  await page.waitForURL(/\/vendor$/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(OUT, "vendor-jordan-375.png"),
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
    askHitTest,
    pages: metricsPages,
  };

  await writeFile(
    path.join(OUT, "metrics.json"),
    `${JSON.stringify(metrics, null, 2)}\n`,
  );

  await browser.close();
  console.log(`Wrote proofs under ${OUT}`);
  console.log(`askHitTest=${askHitTest}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
