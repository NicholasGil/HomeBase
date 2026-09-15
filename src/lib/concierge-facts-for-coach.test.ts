import { describe, expect, it } from "vitest";

import { conciergeFactsForCoach } from "@/lib/concierge-facts-for-coach";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";

describe("conciergeFactsForCoach", () => {
  it("uses server fixture emptyCoachFile, not client discoveryEmpty", () => {
    const withClientFlag = conciergeFactsForCoach({
      session: {
        clerkId: SEED_CLERK_IDS.buyerA,
        name: "Alex",
        role: "buyer",
        transactionId: "seed:buyer-a",
      },
      discoveryEmpty: true,
    });
    const withoutClientFlag = conciergeFactsForCoach({
      session: {
        clerkId: SEED_CLERK_IDS.buyerA,
        name: "Alex",
        role: "buyer",
        transactionId: "seed:buyer-a",
      },
      discoveryEmpty: false,
    });
    expect(withClientFlag).toEqual(withoutClientFlag);
    expect(withClientFlag?.[0]?.key).toBe("next");
    expect(withClientFlag?.[0]?.text).toContain("Schedule inspection");
  });

  it("returns discovery-empty facts when fixture marks emptyCoachFile", () => {
    const facts = conciergeFactsForCoach({
      session: {
        clerkId: SEED_CLERK_IDS.buyerA,
        name: "Alex",
        role: "buyer",
        transactionId: "seed:buyer-a",
        emptyCoachFile: true,
      },
      discoveryEmpty: false,
    });
    expect(facts?.map((fact) => fact.key)).toContain("on_file");
  });
});
