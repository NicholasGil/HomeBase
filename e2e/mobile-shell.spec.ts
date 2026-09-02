import { expect, type Page, test } from "@playwright/test";

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };

const ROUTES = [
  { name: "Alex Rivera", role: "buyer", path: "/dashboard", tabs: 4 },
  { name: "Casey Holt", role: "agent", path: "/agent", tabs: 4 },
  { name: "Jordan Hale", role: "vendor", path: "/vendor", tabs: 2 },
] as const;

async function signInAs(page: Page, name: string) {
  await page.goto("/test-login");
  await page.getByRole("button", { name: `Sign in as ${name}` }).click();
}

test.describe("mobile shell", () => {
  test.use({ viewport: MOBILE, hasTouch: true, isMobile: true });

  for (const route of ROUTES) {
    test(`${route.role} bottom tabs are 44px targets on ${route.path}`, async ({
      page,
    }) => {
      await signInAs(page, route.name);
      await expect(page).toHaveURL(new RegExp(`${route.path}$`));

      await expect(page.getByTestId("app-nav")).toHaveCount(1);
      await expect(page.locator("[data-nav-role]")).toHaveCount(1);
      await expect(page.getByTestId("app-nav")).toHaveAttribute(
        "data-nav-role",
        route.role,
      );
      await expect(
        page.getByTestId("app-nav").getByRole("navigation", { name: "Primary" }),
      ).toBeHidden();

      const bar = page.getByTestId("app-tab-bar");
      await expect(bar).toBeVisible();
      const tabs = bar.getByRole("link");
      await expect(tabs).toHaveCount(route.tabs);

      for (const tab of await tabs.all()) {
        const box = await tab.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.y + box!.height).toBeLessThanOrEqual(MOBILE.height);
      }

      const active = bar.locator("a[aria-current='page']");
      await expect(active).toHaveCount(1);
      await expect(active).toHaveAttribute("href", route.path);

      const avatar = await page.getByTestId("profile-avatar").boundingBox();
      expect(avatar!.width).toBeGreaterThanOrEqual(44);
      expect(avatar!.height).toBeGreaterThanOrEqual(44);
    });
  }

  test("dashboard content is not hidden under the bar when scrolled to bottom", async ({
    page,
  }) => {
    await signInAs(page, "Alex Rivera");
    await expect(page).toHaveURL(/\/dashboard$/);
    // The URL flips while /dashboard/loading.tsx is still on screen; scroll
    // only once the last dashboard region has streamed in.
    await expect(page.getByTestId("concierge")).toBeVisible();

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );

    const barBox = await page.getByTestId("app-tab-bar").boundingBox();
    const mainBox = await page.locator("main").boundingBox();
    expect(barBox).not.toBeNull();
    expect(mainBox).not.toBeNull();
    expect(mainBox!.y + mainBox!.height).toBeLessThanOrEqual(barBox!.y);
  });

  test("tapping a tab navigates and moves the active state", async ({ page }) => {
    await signInAs(page, "Alex Rivera");
    await expect(page).toHaveURL(/\/dashboard$/);
    const bar = page.getByTestId("app-tab-bar");
    await bar.getByRole("link", { name: "Vault" }).click();
    await expect(page).toHaveURL(/\/vault$/);
    await expect(bar.locator("a[aria-current='page']")).toHaveAttribute(
      "href",
      "/vault",
    );
  });
});

test.describe("desktop shell", () => {
  test.use({ viewport: DESKTOP });

  test("header pills stay and the tab bar is hidden", async ({ page }) => {
    await signInAs(page, "Alex Rivera");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId("app-tab-bar")).toBeHidden();
    const nav = page
      .getByTestId("app-nav")
      .getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();
    for (const link of await nav.getByRole("link").all()) {
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
