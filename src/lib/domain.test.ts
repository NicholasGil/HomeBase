import { describe, expect, it } from "vitest";

import {
  DEFAULT_JOURNEY_STAGES,
  MONEY_PROVENANCE,
  ROLES,
  TEN_SECOND_QUESTIONS,
} from "@/lib/domain";

describe("domain schema", () => {
  it("includes every membership role from DESIGN.md", () => {
    expect([...ROLES]).toEqual([
      "buyer",
      "agent",
      "broker",
      "admin",
      "vendor",
    ]);
  });

  it("requires provenance on every money figure", () => {
    expect([...MONEY_PROVENANCE]).toEqual([
      "ai_estimate",
      "lender_issued",
      "title_issued",
      "user_entered",
    ]);
  });

  it("lists the thirteen journey stages in order", () => {
    expect(DEFAULT_JOURNEY_STAGES.map((stage) => stage.key)).toEqual([
      "discovery",
      "financing",
      "favorites",
      "showings",
      "offer",
      "negotiation",
      "under_contract",
      "inspection",
      "appraisal",
      "title",
      "final_walkthrough",
      "closing",
      "move_in",
    ]);
    expect(DEFAULT_JOURNEY_STAGES.map((stage) => stage.order)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    );
  });

  it("covers the five questions of the ten-second test", () => {
    expect(TEN_SECOND_QUESTIONS.map((item) => item.key)).toEqual([
      "where",
      "done",
      "next",
      "waiting",
      "owe",
    ]);
  });
});
