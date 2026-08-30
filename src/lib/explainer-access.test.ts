import { describe, expect, it } from "vitest";

import { SEED_CLERK_IDS } from "../../convex/seedPlan";
import { SEED_TRANSACTION_IDS } from "@/lib/test-session";
import { askFixtureSection, loadFixtureSections } from "@/lib/explainer-access";

const blair = {
  clerkId: SEED_CLERK_IDS.buyerB,
  name: "Blair Chen",
  role: "buyer" as const,
  transactionId: SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerB],
};

describe("fixture explainer", () => {
  it("attaches section context when routing Ask my agent", () => {
    const loaded = loadFixtureSections(blair);
    if (!loaded.ok) {
      throw new Error(loaded.reason);
    }
    expect(loaded.sections.every((row) => row.askAgent === "Ask my agent")).toBe(
      true,
    );
    const asked = askFixtureSection({
      session: blair,
      sectionId: "inspection",
      thread: { turns: [] },
    });
    if (!asked.ok) {
      throw new Error(asked.reason);
    }
    expect(asked.turn.question).toContain("Inspection");
    expect(asked.turn.question).toContain("This section states");
    expect(asked.thread.turns).toHaveLength(1);
    expect(
      askFixtureSection({
        session: {
          clerkId: SEED_CLERK_IDS.lender,
          name: "Jordan Hale",
          role: "vendor",
        },
        sectionId: "inspection",
        thread: { turns: [] },
      }).ok,
    ).toBe(false);
  });
});
