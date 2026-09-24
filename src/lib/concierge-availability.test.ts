import { describe, expect, it } from "vitest";

import { SEED_CLERK_IDS } from "../../convex/seedPlan";
import { conciergeAvailability } from "@/lib/concierge-availability";

describe("conciergeAvailability", () => {
  const fixtureBuyer = {
    clerkId: SEED_CLERK_IDS.buyerA,
    name: "Alex",
    role: "buyer" as const,
    transactionId: "seed:buyer-a" as const,
  };

  it("allows fixture buyers without a model key", () => {
    expect(conciergeAvailability(fixtureBuyer, {})).toBe("ready");
  });

  it("simulates live fail-closed for fixture buyers", () => {
    expect(
      conciergeAvailability(
        { ...fixtureBuyer, simulateModelKeyMissing: true },
        {},
      ),
    ).toBe("model_key_missing");
  });

  it("requires a model key for live (no fixture session)", () => {
    expect(conciergeAvailability(null, {})).toBe("model_key_missing");
    expect(
      conciergeAvailability(null, { OPENAI_API_KEY: "sk-live" }),
    ).toBe("ready");
  });
});
