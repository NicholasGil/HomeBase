import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "proof/demo-followups");
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

  await page
    .getByLabel("Suggested questions")
    .getByRole("button", { name: STARTERS[1] })
    .click();
  await page.getByTestId("concierge-answer").waitFor();
  await page.screenshot({
    path: path.join(OUT, "coach-inspection-answer-375.png"),
    fullPage: false,
  });

  await signInDemoBuyerCoach(page);
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(150);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  let backScrollRestored = false;
  const txHref = await page.evaluate(() => {
    const link = document.querySelector('a[href^="/transactions/"]');
    return link?.getAttribute("href") ?? null;
  });
  if (txHref) {
    await page.getByRole("link", { name: "View file" }).click();
    await page.waitForURL(/\/transactions\//);
    await page.goBack();
    await page.waitForURL(/\/coach$/);
    await page.waitForTimeout(600);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    backScrollRestored =
      scrollBefore > 80 && Math.abs(scrollAfter - scrollBefore) < 48;
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByTestId("demo-full-os-teaser").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(OUT, "coach-full-os-teaser-375.png"),
    fullPage: false,
  });

  await page.getByTestId("concierge-question").focus();
  await page.waitForTimeout(200);
  const tabHiddenOnFocus = await page.evaluate(() => {
    const tab = document.querySelector('[data-testid="app-tab-bar"]');
    if (!tab) return false;
    const rect = tab.getBoundingClientRect();
    return rect.top >= window.innerHeight - 4;
  });
  await page.screenshot({
    path: path.join(OUT, "coach-ask-focused-375.png"),
    fullPage: false,
  });

  const metrics = {
    capturedAt: new Date().toISOString(),
    viewportWidth: VIEWPORT.width,
    env: {
      VERCEL_ENV: "production",
      REALTYRISE_DEMO_MODE: "1",
    },
    backScrollRestored,
    tabHiddenOnAskFocus: tabHiddenOnFocus,
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
