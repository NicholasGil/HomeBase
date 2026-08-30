import { expect, test } from "@playwright/test";

test("grant, third-party view, then revoke is denied", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page.getByTestId("document-vault")).toBeVisible();
  await expect(page.getByTestId("vault-doc-preapproval")).toBeVisible();
  await expect(page.getByTestId("vault-doc-inspection_report")).toBeVisible();
  await expect(page.getByText("Lender issued a $450,000")).toHaveCount(0);
  await expect(page.getByText("Roof and HVAC need service")).toHaveCount(0);

  await page
    .getByTestId("vault-doc-preapproval")
    .getByRole("button", { name: "Grant to Jordan Hale" })
    .click();
  await expect(page.getByText("Granted to lender")).toBeVisible();

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
  await page.goto("/vault");
  await expect(page.getByTestId("vault-doc-preapproval")).toBeVisible();
  await expect(page.getByTestId("vault-doc-inspection_report")).toHaveCount(0);
  await expect(page.getByText("Lender issued a $450,000")).toHaveCount(0);

  await page
    .getByTestId("vault-doc-preapproval")
    .getByRole("link", { name: "Open document" })
    .click();
  await expect(page.getByTestId("document-open-preapproval")).toBeVisible();
  await expect(page.getByText("You cannot open this document.")).toHaveCount(0);
  await expect(page.getByText("Lender issued a $450,000")).toBeVisible();

  await page.goto("/documents/seed-doc-inspection");
  await expect(page.getByTestId("document-denied")).toBeVisible();

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Alex Rivera" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Alex Rivera")).toBeVisible();
  await page.goto("/vault");
  await expect(page.getByText("Signed in as Alex Rivera")).toBeVisible();
  await page.getByRole("button", { name: "Revoke" }).click();
  await expect(
    page.getByTestId("vault-doc-preapproval").getByText("Revoked"),
  ).toBeVisible();
  await expect(page.getByTestId("document-audit")).toContainText(
    "document.revoked",
  );

  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Jordan Hale" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
  await page.goto("/documents/seed-doc-preapproval");
  await expect(page.getByTestId("document-denied")).toBeVisible();
});
