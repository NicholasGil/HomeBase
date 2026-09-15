import { describe, expect, it } from "vitest";

import { answerConcierge } from "./answerConcierge";
import { discoveryEmptyConciergeFacts } from "../../src/lib/seed-concierge-discovery";
import { COACH_FIRST_SESSION_STARTERS } from "../../src/lib/coach-first-session";

describe("answerConcierge discovery empty file", () => {
  const facts = discoveryEmptyConciergeFacts();

  it("answers the three first-session starters explain-only", () => {
    for (const question of COACH_FIRST_SESSION_STARTERS) {
      const answer = answerConcierge(question, facts);
      expect(answer.kind).toBe("answer");
      expect(answer.text.toLowerCase()).not.toMatch(/should i|waive|offer/);
    }

    expect(
      answerConcierge(COACH_FIRST_SESSION_STARTERS[0], facts).text,
    ).toContain("No property is on this file yet");

    expect(
      answerConcierge(COACH_FIRST_SESSION_STARTERS[1], facts).text,
    ).toContain("Nothing is marked missing");

    expect(
      answerConcierge(COACH_FIRST_SESSION_STARTERS[2], facts).text,
    ).toContain("Nothing is on this file yet");
  });
});
