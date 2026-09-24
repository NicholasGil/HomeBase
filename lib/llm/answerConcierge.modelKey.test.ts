import { describe, expect, it } from "vitest";

import { answerConcierge } from "./answerConcierge";
import { CONCIERGE_MODEL_UNAVAILABLE_ANSWER } from "./types";

describe("answerConcierge requireModelKey", () => {
  it("fail-closes without inventing an answer", () => {
    const answer = answerConcierge(
      "What happens next?",
      [{ key: "next", text: "Schedule inspection.", source: "tasks" }],
      { requireModelKey: true },
    );
    expect(answer).toEqual(CONCIERGE_MODEL_UNAVAILABLE_ANSWER);
  });

  it("still answers fixture facts when model key is not required", () => {
    const answer = answerConcierge(
      "What happens next?",
      [{ key: "next", text: "Schedule inspection.", source: "tasks" }],
    );
    expect(answer.text).toContain("Schedule inspection");
    expect(answer.kind).toBe("answer");
  });
});
