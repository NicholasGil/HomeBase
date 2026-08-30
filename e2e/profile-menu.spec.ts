import { expect, type Page, test } from "@playwright/test";

const FIXTURE_ACCOUNTS = [
  { name: "Alex Rivera", role: "buyer", home: /\/dashboard$/ },
  { name: "Blair Chen", role: "buyer", home: /\/dashboard$/ },
  { name: "Indira Shah", role: "buyer", home: /\/dashboard$/ },
  { name: "Casey Holt", role: "agent", home: /\/agent$/ },
  { name: "Jordan Hale", role: "vendor", home: /\/vendor$/ },
] as const;

async function signInAs(page: Page, name: string) {
  await page.goto("/test-login");
  await page.getByRole("button", { name: `Sign in as ${name}` }).click();
}

async function expectProfileMenu(
  page: Page,
  account: { name: string; role: string },
) {
  const avatar = page.getByTestId("profile-avatar");
  await expect(avatar).toBeVisible();
  await expect(avatar).toHaveAttribute("aria-haspopup", "menu");
  await expect(avatar).toHaveAttribute("aria-expanded", "false");

  await avatar.click();
  await expect(avatar).toHaveAttribute("aria-expanded", "true");

  const menu = page.getByTestId("profile-menu");
  await expect(menu).toBeVisible();
  await expect(menu).toContainText(account.name);
  await expect(menu).toContainText(account.role);
  await expect(
    menu.getByRole("menuitem", { name: "Profile settings" }),
  ).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
  return menu;
}

test("avatar opens the same profile menu for every fixture role", async ({
  page,
}) => {
  for (const account of FIXTURE_ACCOUNTS) {
    await signInAs(page, account.name);
    await expect(page).toHaveURL(account.home);
    await expect(page.getByTestId("app-nav")).toHaveAttribute(
      "data-nav-role",
      account.role,
    );
    await expectProfileMenu(page, account);
    await page.getByTestId("profile-avatar").click();
    await expect(page.getByTestId("profile-menu")).toHaveCount(0);
  }
});

test("buyer avatar opens profile settings and signs out to fixture login", async ({
  page,
}) => {
  await signInAs(page, "Alex Rivera");
  await expect(page).toHaveURL(/\/dashboard$/);

  const avatar = page.getByTestId("profile-avatar");
  await avatar.press("Enter");
  const menu = page.getByTestId("profile-menu");
  await expect(menu).toBeVisible();
  await expect(menu).toContainText("Alex Rivera");
  await expect(menu).toContainText("buyer");

  await menu.getByRole("menuitem", { name: "Profile settings" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByTestId("profile-settings")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await expect(page.getByTestId("profile-back")).toBeVisible();
  await expect(page.getByText("Display only")).toBeVisible();
  await expect(page.getByText("Alex Rivera")).toBeVisible();
  await expect(page.getByText("alex.rivera@example.com")).toBeVisible();
  await expect(page.getByText("256-555-0101")).toBeVisible();
  await expect(page.getByText("buyer")).toBeVisible();

  await expectProfileMenu(page, { name: "Alex Rivera", role: "buyer" });
  await page
    .getByTestId("profile-menu")
    .getByRole("menuitem", { name: "Sign out" })
    .click();
  await expect(page).toHaveURL(/\/test-login$/);
  await expect(
    page.getByRole("button", { name: "Sign in as Alex Rivera" }),
  ).toBeVisible();
});

test("agent avatar opens the menu and signs out to fixture login", async ({
  page,
}) => {
  await signInAs(page, "Casey Holt");
  await expect(page).toHaveURL(/\/agent$/);
  await expectProfileMenu(page, { name: "Casey Holt", role: "agent" });
  await page
    .getByTestId("profile-menu")
    .getByRole("menuitem", { name: "Sign out" })
    .click();
  await expect(page).toHaveURL(/\/test-login$/);
  await expect(
    page.getByRole("button", { name: "Sign in as Casey Holt" }),
  ).toBeVisible();
});

test("buyer avatar menu stays on search, tours, vault, and the closed hub", async ({
  page,
}) => {
  await signInAs(page, "Alex Rivera");
  await expect(page).toHaveURL(/\/dashboard$/);
  for (const path of ["/search", "/tours", "/vault"]) {
    await page.goto(path);
    await expectProfileMenu(page, { name: "Alex Rivera", role: "buyer" });
    await page.getByTestId("profile-avatar").click();
  }

  await signInAs(page, "Indira Shah");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/homeownership/seed:buyer-h");
  await expect(page.getByTestId("homeownership-hub")).toBeVisible();
  await expectProfileMenu(page, { name: "Indira Shah", role: "buyer" });
});
