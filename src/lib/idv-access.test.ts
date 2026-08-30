import { describe, expect, it } from "vitest";

import { IDV_NOT_ENABLED } from "../../convex/lib/idv";
import { attemptFixtureHighRisk, loadFixtureIdv } from "@/lib/idv-access";
import { getFeatureFlags } from "@/lib/flags";

const buyer = {
  clerkId: "clerk_buyer_a" as const,
  name: "Alex Rivera",
  role: "buyer" as const,
  transactionId: "seed:buyer-a" as const,
};

describe("fixture idv", () => {
  it("rejects high-risk actions when FLAG_IDV is off and AL is not allowed", () => {
    expect(getFeatureFlags().FLAG_IDV).toBe(false);
    const loaded = loadFixtureIdv(buyer);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      throw new Error("expected gating");
    }
    expect(loaded.gating).toMatchObject({
      flagOn: false,
      orgState: "AL",
      stateAllowed: false,
      allowed: false,
    });
    expect(
      attemptFixtureHighRisk({ session: buyer, action: "financial_document" }),
    ).toEqual({ ok: false, reason: IDV_NOT_ENABLED });
    expect(
      attemptFixtureHighRisk({ session: buyer, action: "designated_document" }),
    ).toEqual({ ok: false, reason: IDV_NOT_ENABLED });
    expect(
      attemptFixtureHighRisk({ session: buyer, action: "account_recovery" }),
    ).toEqual({ ok: false, reason: IDV_NOT_ENABLED });
  });

  it("denies a vendor", () => {
    expect(
      loadFixtureIdv({
        clerkId: "clerk_lender",
        name: "Jordan Hale",
        role: "vendor",
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });
});
