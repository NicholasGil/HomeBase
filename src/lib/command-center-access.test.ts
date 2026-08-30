import { describe, expect, it } from "vitest";

import { loadSeedCommandCenterForViewer } from "@/lib/command-center-access";
import { startTestSessionDecision } from "@/lib/test-session";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";

describe("command center fixture access", () => {
  it("denies an unauthenticated caller", () => {
    expect(loadSeedCommandCenterForViewer(null)).toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
  });

  it("denies buyer and vendor sessions", () => {
    const buyer = startTestSessionDecision(SEED_CLERK_IDS.buyerA);
    const vendor = startTestSessionDecision(SEED_CLERK_IDS.lender);
    if (!buyer.ok || !vendor.ok) {
      throw new Error("expected fixture sessions");
    }
    expect(loadSeedCommandCenterForViewer(buyer.session)).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
    expect(loadSeedCommandCenterForViewer(vendor.session)).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
  });

  it("returns the eight-client book to the seeded agent", () => {
    const agent = startTestSessionDecision(SEED_CLERK_IDS.agent);
    if (!agent.ok) {
      throw new Error("expected agent session");
    }
    const loaded = loadSeedCommandCenterForViewer(agent.session);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.view.roster).toHaveLength(8);
      expect(loaded.view.priority[0]?.name).toBe("Dana Ortiz");
      expect(loaded.view.priority[1]?.name).toBe("Ellis Park");
    }
  });
});
