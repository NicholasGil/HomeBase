import { expect, test } from "../fixtures";

import { scrollCoachDeep } from "../helpers/coach-scroll-deep";

test.use({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

async function expectCoachOpensAtTop(page: import("@playwright/test").Page) {
  await expect(page.getByTestId("coach-first-session-empty")).toBeVisible();
  await page.waitForFunction(() => window.scrollY <= 10, undefined, {
    timeout: 8000,
  });
}

test("demo persona via chooser does not carry file coach scroll", async ({
  page,
}) => {
  await page.goto("/demo/enter/buyer-coach");
  await expect(page).toHaveURL(/\/coach$/);
  await page.getByTestId("coach-ten-second").waitFor();
  await scrollCoachDeep(page, 380);

  await page.goto("/demo");
  await page.goto("/demo/enter/buyer-discovery");
  await expect(page).toHaveURL(/\/coach$/);
  await expectCoachOpensAtTop(page);
});

test("direct demo enter discovery ignores prior file coach depth", async ({
  page,
}) => {
  await page.goto("/demo/enter/buyer-coach");
  await expect(page).toHaveURL(/\/coach$/);
  await page.getByTestId("coach-ten-second").waitFor();
  await scrollCoachDeep(page, 380);

  await page.goto("/demo/enter/buyer-discovery");
  await expect(page).toHaveURL(/\/coach$/);
  await expectCoachOpensAtTop(page);
});

test("demo enter file coach opens at top after discovery scroll", async ({
  page,
}) => {
  await page.goto("/demo/enter/buyer-discovery");
  await expect(page).toHaveURL(/\/coach$/);
  await page.getByTestId("coach-first-session-empty").waitFor();
  await scrollCoachDeep(page, 340);

  await page.goto("/demo/enter/buyer-coach");
  await expect(page).toHaveURL(/\/coach$/);
  await page.getByTestId("coach-ten-second").waitFor();
  await page.waitForFunction(() => window.scrollY <= 10, undefined, {
    timeout: 8000,
  });
});
