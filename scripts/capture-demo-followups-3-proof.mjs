import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "proof/demo-followups-3");
const BASE = process.env.PROOF_BASE_URL ?? "http://127.0.0.1:3000";
const VIEWPORT = { width: 375, height: 812 };
const SCROLL_KEY = "realtyrise.coach.scrollY.v1";

async function signInDemoBuyerCoach(page) {
  await page.goto(`${BASE}/demo`);
  await page.getByTestId("demo-persona-buyer-coach").getByRole("button").click();
  await page.waitForURL(/\/coach$/);
}

async function signInDemoBuyerDiscovery(page) {
  await page.goto(`${BASE}/demo`);
  await page.getByTestId("demo-persona-buyer-discovery").getByRole("button").click();
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

  await signInDemoBuyerDiscovery(page);
  await page.getByTestId("concierge-mobile-dock").waitFor();
  await page.screenshot({
    path: path.join(OUT, "discovery-first-paint-375.png"),
    fullPage: false,
  });

  const discoveryStarter = "What happens next?";
  await page.getByRole("button", { name: discoveryStarter }).click();
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
  await page.getByTestId("concierge-more-starters-sheet").waitFor();
  await page.screenshot({
    path: path.join(OUT, "more-sheet-open-375.png"),
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await page.getByTestId("concierge-more-starters-sheet").waitFor({ state: "hidden" });

  await page
    .getByTestId("concierge-mobile-dock")
    .getByRole("button", { name: "What happens next?" })
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

  await signInDemoBuyerCoach(page);
  await page.evaluate(() => window.scrollTo(0, 360));
  await page.waitForTimeout(120);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  let backScrollRestored = false;
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
    await page.waitForTimeout(600);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    backScrollRestored =
      scrollBefore > 80 && Math.abs(scrollAfter - scrollBefore) < 48;
    await page.screenshot({
      path: path.join(OUT, "back-from-transaction-scroll-375.png"),
      fullPage: false,
    });
  }

  const metrics = {
    capturedAt: new Date().toISOString(),
    viewportWidth: VIEWPORT.width,
    env: {
      VERCEL_ENV: "production",
      REALTYRISE_DEMO_MODE: "1",
    },
    backScrollRestored,
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
