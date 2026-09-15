import { describe, expect, it } from "vitest";

import {
  answerCoachFirstSessionStarter,
  COACH_FIRST_SESSION_STARTER_LABELS,
} from "./coachFirstSession";
import { discoveryEmptyConciergeFacts } from "./discoveryEmptyFacts";

describe("coach first session starters", () => {
  const facts = discoveryEmptyConciergeFacts();

  it("maps each locked starter to an explain-only answer", () => {
    for (const question of COACH_FIRST_SESSION_STARTER_LABELS) {
      const answer = answerCoachFirstSessionStarter(question, facts);
      expect(answer).not.toBeNull();
      expect(answer?.kind).toBe("answer");
      expect(answer?.text.length).toBeGreaterThan(10);
    }
  });

  it("does not answer unrelated questions", () => {
    expect(
      answerCoachFirstSessionStarter("Should I waive inspection?", facts),
    ).toBeNull();
  });
});
