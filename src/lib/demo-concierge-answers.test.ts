import { describe, expect, it } from "vitest";

import { completeConcierge } from "../../lib/llm";
import { enrichDemoFileSessionAnswer } from "@/lib/demo-concierge-answers";
import { FILE_SESSION_CONCIERGE_STARTERS } from "@/lib/concierge-starters";
import { seedConciergeFacts } from "@/lib/seed-concierge";
import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";

const facts = seedConciergeFacts(SEED_CLERK_IDS.buyerA);
const SNAKE_CASE = /[a-z]+_[a-z0-9_]+/;

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
      "When is my inspection?",
      { text: "stub", kind: "answer", sources: ["appointments"] },
      facts,
    );
    expect(inspection.text).toContain("Inspection is at");
    expect(inspection.text).toContain("Riley Brooks");
    expect(inspection.text).toContain("Bring photo ID");
    expect(inspection.text).toContain("repair request");
    expect(inspection.text).not.toMatch(SNAKE_CASE);
  });

  it("matches booked demo inspection as the next step", () => {
    const attendFacts = facts.map((row) =>
      row.key === "next"
        ? {
            ...row,
            text: "Next is Attend inspection on Wed, Oct 15, 2026, assigned to buyer.",
          }
        : row,
    );
    const next = enrichDemoFileSessionAnswer(
      "What happens next?",
      { text: "stub", kind: "answer", sources: ["tasks"] },
      attendFacts,
    );
    expect(next.text.toLowerCase()).toContain("attend inspection");
    const inspection = enrichDemoFileSessionAnswer(
      "When is my inspection?",
      { text: "stub", kind: "answer", sources: ["appointments"] },
      attendFacts,
    );
    expect(inspection.text).not.toContain("repair request");
  });

  it("does not leak snake_case ids in file-session demo answers", () => {
    for (const question of FILE_SESSION_CONCIERGE_STARTERS) {
      const base = completeConcierge({
        question,
        facts,
        otherClientNames: ["Blair Chen"],
      });
      const answer = enrichDemoFileSessionAnswer(question, base, facts);
      if (answer.kind === "answer") {
        expect(answer.text).not.toMatch(SNAKE_CASE);
      }
    }
  });
});
