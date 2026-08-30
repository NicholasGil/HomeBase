import { describe, expect, it } from "vitest";

import { fixtureContactForSession } from "@/lib/profile";
import { startTestSessionDecision } from "@/lib/test-session";
import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";

describe("fixtureContactForSession", () => {
  it("returns seed email and phone for each fixture role", () => {
    const local = { VERCEL_ENV: "development" };
    const alex = startTestSessionDecision(SEED_CLERK_IDS.buyerA, local);
    const casey = startTestSessionDecision(SEED_CLERK_IDS.agent, local);
    const jordan = startTestSessionDecision(SEED_CLERK_IDS.lender, local);
    if (!alex.ok || !casey.ok || !jordan.ok) {
      throw new Error("seed sessions");
    }

    expect(fixtureContactForSession(alex.session)).toEqual({
      email: "alex.rivera@example.com",
      phone: "256-555-0101",
    });
    expect(fixtureContactForSession(casey.session)).toEqual({
      email: SEED_PLAN.agent.email,
      phone: SEED_PLAN.agent.phone,
    });
    expect(fixtureContactForSession(jordan.session)).toEqual({
      email: SEED_PLAN.lender.email,
      phone: SEED_PLAN.lender.phone,
    });
  });
});
