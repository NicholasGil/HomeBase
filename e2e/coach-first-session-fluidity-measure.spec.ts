import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const FIRST_SESSION_STARTERS = [
  "What happens next?",
  "What am I missing for this stage?",
  "What's already on my file?",
] as const;

const TIP_SHA = process.env.FLUIDITY_TIP_SHA ?? "96c68c7";
const REPORT_PATH = path.join(
  "proof",
  "coach-first-session",
  `fluidity-measure-${TIP_SHA}.md`,
);

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function signInAlexDiscoveryEmpty(page: import("@playwright/test").Page) {
  await page.goto("/test-login");
  await page.getByTestId("sign-in-alex-discovery-empty").getByRole("button").click();
  await expect(page).toHaveURL(/\/coach$/);
}

function conciergeScrollRegion(page: import("@playwright/test").Page) {
  return page.getByTestId("concierge-scroll-region");
}

test("fluidity measure @375 — write report", async ({ page }) => {
  const results: {
    section: string;
    pass: boolean;
    detail: string;
    severity?: "blocker" | "major" | "minor";
  }[] = [];

  await signInAlexDiscoveryEmpty(page);

  const emptyVisible = await page.getByTestId("coach-first-session-empty").isVisible();
  const coachHomeVisible = await page.getByTestId("coach-home").isVisible();
  const discovery1 = emptyVisible && coachHomeVisible;
  results.push({
    section: "1a Empty state visible",
    pass: discovery1,
    detail: `coach-home=${coachHomeVisible}, coach-first-session-empty=${emptyVisible}`,
  });

  const chips = page.getByLabel("Suggested questions").getByRole("button");
  const chipCount = await chips.count();
  results.push({
    section: "1b Exactly 3 starters",
    pass: chipCount === 3,
    detail: `count=${chipCount}`,
  });

  const starterLabels: string[] = [];
  for (const label of FIRST_SESSION_STARTERS) {
    const visible = await page.getByRole("button", { name: label }).isVisible();
    starterLabels.push(`${label}: visible=${visible}`);
  }
  const labelsMatch =
    chipCount === 3 &&
    (await Promise.all(
      FIRST_SESSION_STARTERS.map((l) =>
        page.getByRole("button", { name: l }).isVisible(),
      ),
    )).every(Boolean);
  results.push({
    section: "1c Starter labels",
    pass: labelsMatch,
    detail: starterLabels.join("; "),
  });

  const tapTargets: { label: string; w: number; h: number; pass: boolean }[] = [];
  let tapPass = true;
  for (const label of FIRST_SESSION_STARTERS) {
    const chip = page.getByRole("button", { name: label });
    const box = await chip.boundingBox();
    const w = box ? Math.round(box.width) : 0;
    const h = box ? Math.round(box.height) : 0;
    const ok = box !== null && h >= 44;
    if (!ok) tapPass = false;
    tapTargets.push({ label, w, h, pass: ok });
  }
  results.push({
    section: "1d Tap targets ≥44px height",
    pass: tapPass,
    detail: tapTargets
      .map((t) => `"${t.label}" ${t.w}×${t.h}px`)
      .join("; "),
  });

  const scroll = conciergeScrollRegion(page);
  await scroll.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });

  const compose = page.getByTestId("concierge-compose");
  const composeBox = await compose.boundingBox();
  const clearances: { label: string; clearancePx: number; pass: boolean }[] = [];
  let clearancePass = true;
  for (const label of FIRST_SESSION_STARTERS) {
    const chip = page.getByRole("button", { name: label });
    const chipBox = await chip.boundingBox();
    const bottom = chipBox ? chipBox.y + chipBox.height : 0;
    const askTop = composeBox ? composeBox.y : 0;
    const clearance = composeBox && chipBox ? askTop - bottom : -999;
    const rounded = Math.round(clearance * 10) / 10;
    const ok = chipBox !== null && composeBox !== null && bottom <= askTop + 1;
    if (!ok) clearancePass = false;
    clearances.push({ label, clearancePx: rounded, pass: ok });
  }
  const minClearance = Math.min(...clearances.map((c) => c.clearancePx));
  results.push({
    section: "2 Sticky Ask clearance (scroll end)",
    pass: clearancePass,
    detail: `${clearances.map((c) => `${c.label}: ${c.clearancePx}px`).join("; ")}; min=${minClearance}px`,
  });

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
    const clientW = doc.clientWidth;
    return {
      scrollWidth: scrollW,
      clientWidth: clientW,
      horizontalOverflow: scrollW > clientW + 1,
    };
  });
  results.push({
    section: "3a No horizontal overflow (page)",
    pass: !overflow.horizontalOverflow,
    detail: `scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`,
  });

  const tabBar = page.getByTestId("app-tab-bar");
  const tabVisible = await tabBar.isVisible();
  let tabDetail = "tab bar not visible";
  let tabPass = true;
  if (tabVisible) {
    const barBox = await tabBar.boundingBox();
    const tabs = tabBar.getByRole("link");
    const tabCount = await tabs.count();
    const sizes: string[] = [];
    for (let i = 0; i < tabCount; i++) {
      const tbox = await tabs.nth(i).boundingBox();
      if (tbox) {
        sizes.push(
          `${Math.round(tbox.width)}×${Math.round(tbox.height)}px`,
        );
        if (tbox.height < 44) tabPass = false;
      }
    }
    tabDetail = `bar=${barBox ? `${Math.round(barBox.width)}×${Math.round(barBox.height)}px` : "n/a"}; tabs(${tabCount}): ${sizes.join(", ")}`;
  }
  results.push({
    section: "3b Tabs present (sizes)",
    pass: tabPass,
    detail: tabDetail,
  });

  const allPass = results.every((r) => r.pass);
  const holes = results.filter((r) => !r.pass);

  const lines: string[] = [
    "# Website Fluidity Manager — measure @375",
    "",
    `- **Fixture:** test-login → Discovery Alex (no property)`,
    `- **Branch tip:** \`${TIP_SHA}\``,
    `- **Viewport:** 375×812, touch, mobile`,
    `- **Generated:** ${new Date().toISOString()}`,
    "",
    `## Verdict: ${allPass ? "PASS" : "FAIL"}`,
    "",
    "| Check | Result | Detail |",
    "| --- | --- | --- |",
  ];

  for (const r of results) {
    lines.push(
      `| ${r.section} | **${r.pass ? "PASS" : "FAIL"}** | ${r.detail.replace(/\|/g, "\\|")} |`,
    );
  }

  if (holes.length > 0) {
    lines.push("", "## HOLES", "");
    for (const h of holes) {
      lines.push(`- **${h.section}** (${h.severity ?? "major"}): ${h.detail}`);
    }
  } else {
    lines.push("", "## Summary", "", "All discovery empty-coach checks passed at 375px width.");
  }

  lines.push("", "---", "", allPass ? "FLUIDITY_MEASURE_PASS" : "FLUIDITY_MEASURE_FAIL");

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, lines.join("\n") + "\n", "utf8");

  expect(allPass).toBe(true);
});
