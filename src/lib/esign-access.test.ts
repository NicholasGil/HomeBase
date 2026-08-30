import { describe, expect, it } from "vitest";

import { ESIGN_NOT_ENABLED } from "../../convex/lib/esign";
import {
  loadFixtureEsign,
  sendFixturePacket,
  signFixturePacket,
} from "@/lib/esign-access";
import { getFeatureFlags } from "@/lib/flags";

const buyer = {
  clerkId: "clerk_buyer_a" as const,
  name: "Alex Rivera",
  role: "buyer" as const,
  transactionId: "seed:buyer-a" as const,
};

describe("fixture e-sign", () => {
  it("shows the seeded packet and fail-closes provider send when FLAG_ESIGN is off", () => {
    expect(getFeatureFlags().FLAG_ESIGN).toBe(false);
    const loaded = loadFixtureEsign({ session: buyer, state: { packets: [] } });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      throw new Error("expected packet list");
    }
    expect(loaded.flagOn).toBe(false);
    expect(loaded.packets[0]?.status).toBe("prepare");
    expect(loaded.sections[0]?.askAgent).toBe("Ask my agent");
    expect(sendFixturePacket({ session: buyer })).toEqual({
      ok: false,
      reason: ESIGN_NOT_ENABLED,
    });
    expect(signFixturePacket({ session: buyer })).toEqual({
      ok: false,
      reason: ESIGN_NOT_ENABLED,
    });
  });

  it("denies a vendor", () => {
    expect(
      loadFixtureEsign({
        session: {
          clerkId: "clerk_lender",
          name: "Jordan Hale",
          role: "vendor",
        },
        state: { packets: [] },
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });
});
