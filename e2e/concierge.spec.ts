import { expect, type Locator, type Page, test } from "@playwright/test";

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };
const FAB_SIZE = 56;
const SUGGESTION_CHIPS = 8;

async function signInAs(page: Page, name: string) {
  await page.goto("/test-login");
  await page.getByRole("button", { name: `Sign in as ${name}` }).click();
}

// The sheet slides in over 200ms, so its edges are polled until they land.
async function edges(locator: Locator) {
  const box = await locator.boundingBox();
  if (box === null) {
    return null;
  }
  return {
    left: Math.round(box.x),
    top: Math.round(box.y),
    right: Math.round(box.x + box.width),
    bottom: Math.round(box.y + box.height),
    width: Math.round(box.width),
    height: Math.round(box.height),
  };
}

test("concierge answers a seed question and refuses another client", async ({
  page,
}) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await page.getByTestId("concierge-fab").click();
  await expect(page.getByTestId("concierge")).toBeVisible();

  await page.getByRole("button", { name: "What happens next?" }).click();
  await expect(page.getByTestId("concierge-answer")).toContainText(
    "Schedule inspection",
  );

  await page.getByTestId("concierge-question").fill(
    "What happens next on Blair Chen's file?",
  );
  await page.getByTestId("concierge-ask").click();
  await expect(page.getByTestId("concierge-answer")).toHaveAttribute(
    "data-kind",
    "refuse",
  );
  await expect(page.getByTestId("concierge-answer")).toContainText(
    "another client's file",
  );
  await expect(page.getByTestId("concierge-answer")).not.toContainText("$");
});

test.describe("concierge sheet", () => {
  test("opens from the FAB with the transaction scope and eight chips", async ({
    page,
  }) => {
    await signInAs(page, "Alex Rivera");
    await expect(page).toHaveURL(/\/dashboard$/);

    const fab = page.getByTestId("concierge-fab");
    await expect(fab).toBeVisible();
    await expect(fab).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("concierge")).toHaveCount(0);

    await fab.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByTestId("concierge")).toBeVisible();

    const scope = page.getByTestId("concierge-scope");
    await expect(scope).toContainText("814 Maple Ave");
    await expect(scope).toContainText("Inspection");

    const chips = page
      .getByLabel("Suggested questions")
      .getByRole("button");
    await expect(chips).toHaveCount(SUGGESTION_CHIPS);
    for (const chip of await chips.all()) {
      const box = await chip.boundingBox();
      expect(box).not.toBeNull();
      expect(Math.round(box!.height)).toBeGreaterThanOrEqual(44);
    }

    await page.getByRole("button", { name: "Close concierge" }).click();
    await expect(page.getByTestId("concierge")).toHaveCount(0);
    await expect(fab).toBeVisible();
  });

  test("refusals render in sand with Ask my agent and figures carry provenance", async ({
    page,
  }) => {
    await signInAs(page, "Alex Rivera");
    await page.getByTestId("concierge-fab").click();

    await page.getByRole("button", { name: "How much cash will I need?" }).click();
    const answer = page.getByTestId("concierge-answer");
    await expect(answer).toHaveAttribute("data-kind", "answer");
    await expect(answer.locator("[data-provenance='title_issued']")).toBeVisible();
    await expect(answer).toContainText("$450.00");
    await expect(page.getByTestId("concierge-ask-agent")).toHaveCount(0);

    await page.getByTestId("concierge-question").fill("Should I offer more?");
    await page.getByTestId("concierge-ask").click();
    await expect(answer).toHaveAttribute("data-kind", "ask_agent");
    await expect(answer).toHaveClass(/bg-sand/);
    await expect(answer).not.toContainText("$");
    const askAgent = page.getByTestId("concierge-ask-agent");
    await expect(askAgent).toBeVisible();
    await expect(askAgent).toHaveAttribute("href", "/offers#agent-thread");
  });

  test("agents and vendors never get the FAB", async ({ page }) => {
    await signInAs(page, "Casey Holt");
    await expect(page).toHaveURL(/\/agent$/);
    await expect(page.getByTestId("app-nav")).toBeVisible();
    await expect(page.getByTestId("concierge-fab")).toHaveCount(0);
    await expect(page.getByTestId("concierge")).toHaveCount(0);

    await signInAs(page, "Jordan Hale");
    await expect(page).toHaveURL(/\/vendor$/);
    await expect(page.getByTestId("app-nav")).toBeVisible();
    await expect(page.getByTestId("concierge-fab")).toHaveCount(0);
    await expect(page.getByTestId("concierge")).toHaveCount(0);
  });

  test("the FAB follows the buyer across routes", async ({ page }) => {
    await signInAs(page, "Alex Rivera");
    await expect(page).toHaveURL(/\/dashboard$/);
    for (const path of ["/vault", "/tours", "/search"]) {
      await page.goto(path);
      await expect(page.getByTestId("concierge-fab")).toBeVisible();
    }
  });
});

test.describe("concierge sheet at 375", () => {
  test.use({ viewport: MOBILE, hasTouch: true, isMobile: true });

  test("FAB is 56px and clears the tab bar; sheet is a bottom sheet", async ({
    page,
  }) => {
    await signInAs(page, "Alex Rivera");
    await expect(page).toHaveURL(/\/dashboard$/);

    const fab = page.getByTestId("concierge-fab");
    const fabBox = await fab.boundingBox();
    const barBox = await page.getByTestId("app-tab-bar").boundingBox();
    expect(fabBox).not.toBeNull();
    expect(barBox).not.toBeNull();
    expect(Math.round(fabBox!.width)).toBe(FAB_SIZE);
    expect(Math.round(fabBox!.height)).toBe(FAB_SIZE);
    expect(fabBox!.y + fabBox!.height).toBeLessThanOrEqual(barBox!.y);
    expect(fabBox!.x + fabBox!.width).toBeLessThanOrEqual(MOBILE.width);

    await fab.click();
    const sheet = page.getByTestId("concierge-sheet");
    await expect(sheet).toHaveAttribute("data-side", "bottom");
    await expect.poll(() => edges(sheet)).toEqual({
      left: 0,
      top: MOBILE.height - Math.round(MOBILE.height * 0.85),
      right: MOBILE.width,
      bottom: MOBILE.height,
      width: MOBILE.width,
      height: Math.round(MOBILE.height * 0.85),
    });
  });
});

test.describe("concierge sheet at 1280", () => {
  test.use({ viewport: DESKTOP });

  test("sheet is a 420px right panel and the FAB sits in the corner", async ({
    page,
  }) => {
    await signInAs(page, "Alex Rivera");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId("app-tab-bar")).toBeHidden();

    const fab = page.getByTestId("concierge-fab");
    const fabBox = await fab.boundingBox();
    expect(fabBox).not.toBeNull();
    expect(Math.round(fabBox!.width)).toBe(FAB_SIZE);
    expect(fabBox!.y + fabBox!.height).toBeLessThanOrEqual(DESKTOP.height);

    await fab.click();
    const sheet = page.getByTestId("concierge-sheet");
    await expect(sheet).toHaveAttribute("data-side", "right");
    await expect.poll(() => edges(sheet)).toEqual({
      left: DESKTOP.width - 420,
      top: 0,
      right: DESKTOP.width,
      bottom: DESKTOP.height,
      width: 420,
      height: DESKTOP.height,
    });
  });
});
