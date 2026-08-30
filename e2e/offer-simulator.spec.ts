import { expect, test } from "@playwright/test";

const DERIVED = [
  "sim-estimatedLoan",
  "sim-closingCosts",
  "sim-cashToClose",
  "sim-monthlyPayment",
  "sim-monthlyTaxesInsurance",
  "sim-totalMonthly",
] as const;

test("a $10k price change updates all six estimates", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: "Sign in as Blair Chen" }).click();
  await expect(page.getByTestId("offer-simulator")).toBeVisible();
  await expect(page.getByTestId("assumptions-panel")).toBeVisible();

  const before: Record<string, string> = {};
  for (const id of DERIVED) {
    const text = await page.getByTestId(id).innerText();
    expect(text).toContain("ESTIMATE");
    before[id] = text;
  }

  const price = page.getByTestId("sim-price");
  const start = Number(await price.inputValue());
  await price.fill(String(start + 10000));
  await expect(page.getByTestId("assumptions-panel")).toBeVisible();

  for (const id of DERIVED) {
    const output = page.getByTestId(id);
    await expect(output).toContainText("ESTIMATE");
    await expect(output).not.toHaveText(before[id] ?? "");
  }
});
