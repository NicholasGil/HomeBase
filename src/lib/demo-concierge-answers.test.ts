import { describe, expect, it } from "vitest";

import { enrichDemoFileSessionAnswer } from "@/lib/demo-concierge-answers";
import { seedConciergeFacts } from "@/lib/seed-concierge";
import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";

const facts = seedConciergeFacts(SEED_CLERK_IDS.buyerA);

describe("enrichDemoFileSessionAnswer", () => {
  it("names Casey Holt and returns multi-line seed-only copy", () => {
    const next = enrichDemoFileSessionAnswer(
      "What happens next?",
      { text: "stub", kind: "answer", sources: ["tasks"] },
      facts,
    );
    expect(next.text).toContain(SEED_PLAN.agent.name);
    expect(next.text).not.toMatch(/\bagent\b/i);
    expect(next.text.split("\n").length).toBeGreaterThanOrEqual(2);

    const inspection = enrichDemoFileSessionAnswer(
      "When's my inspection?",
      { text: "stub", kind: "answer", sources: ["appointments"] },
      facts,
    );
    expect(inspection.text).toContain("Inspection is at");
    expect(inspection.text).toContain("Bring photo ID");
  });
});
