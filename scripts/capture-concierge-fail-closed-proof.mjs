import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "proof/concierge-fail-closed");
const BASE = process.env.PROOF_BASE_URL ?? "http://127.0.0.1:3000";

async function signInCoachUnavailable(page) {
  await page.goto(`${BASE}/test-login`);
  await page.getByTestId("sign-in-alex-coach-unavailable").click();
  await page.waitForURL(/\/coach$/);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();

  await signInCoachUnavailable(page);
  await page.screenshot({
    path: path.join(OUT, "a-coach-unavailable-375.png"),
    fullPage: true,
  });

  await page.goto(`${BASE}/vault`);
  await page.getByTestId("concierge-fab").click();
  await page.getByTestId("concierge-sheet").waitFor();
  await page.screenshot({
    path: path.join(OUT, "b-sheet-unavailable-375.png"),
    fullPage: false,
  });

  await browser.close();
  console.log(`Wrote proofs under ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
