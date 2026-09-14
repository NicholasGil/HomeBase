import { describe, expect, it } from "vitest";

import {
  COACH_ENTRY_PRICE_LABEL,
  COACH_ENTRY_PRICE_MONTHLY_USD,
  PRICING_BILLING_DISCLAIMER,
} from "@/lib/pricing";

describe("coach entry pricing copy", () => {
  it("locks coach entry at $10/mo for buyer-facing surfaces", () => {
    expect(COACH_ENTRY_PRICE_MONTHLY_USD).toBe(10);
    expect(COACH_ENTRY_PRICE_LABEL).toBe("$10/mo");
    expect(PRICING_BILLING_DISCLAIMER).toMatch(/not enabled/i);
    expect(PRICING_BILLING_DISCLAIMER).toMatch(/no payment/i);
  });
});
