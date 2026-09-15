import { describe, expect, it } from "vitest";

import { conciergeFactsForCoach } from "@/lib/concierge-facts-for-coach";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";

describe("conciergeFactsForCoach", () => {
  it("uses populated seed facts when emptyCoachFile is not set", () => {
    const facts = conciergeFactsForCoach({
      clerkId: SEED_CLERK_IDS.buyerA,
      name: "Alex",
      role: "buyer",
      transactionId: "seed:buyer-a",
    });
    expect(facts[0]?.text).toContain("Schedule inspection");
  });

  it("returns discovery-empty facts when fixture marks emptyCoachFile", () => {
    const facts = conciergeFactsForCoach({
      clerkId: SEED_CLERK_IDS.buyerA,
      name: "Alex",
      role: "buyer",
      transactionId: "seed:buyer-a",
      emptyCoachFile: true,
    });
    expect(facts.map((fact) => fact.key)).toContain("on_file");
  });
});
