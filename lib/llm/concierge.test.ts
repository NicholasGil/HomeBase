import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { completeConcierge } from "./index";
import { containsRawPii, redactPii } from "./redact";
import { CANONICAL_QUESTIONS } from "./types";
import { seedConciergeFacts } from "../../src/lib/seed-concierge";
import { containsRawIsoDateTime } from "../../convex/lib/displayTime";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";

const facts = seedConciergeFacts(SEED_CLERK_IDS.buyerA);

describe("concierge", () => {
  it("loads a versioned prompt that explains and never advises", () => {
    const prompt = readFileSync(
      path.join(process.cwd(), "lib/llm/prompts/concierge.v1.txt"),
      "utf8",
    );
    expect(prompt).toMatch(/never advise/i);
    expect(prompt).toMatch(/Ask my agent/);
    expect(CANONICAL_QUESTIONS).toHaveLength(8);
  });

  it("answers the eight canonical questions from seed facts", () => {
    const answers = CANONICAL_QUESTIONS.map((question) =>
      completeConcierge({ question, facts, otherClientNames: ["Blair Chen"] }),
    );
    expect(answers[0]?.text).toContain("Schedule inspection");
    expect(answers[1]?.text).toBe(
      "Inspection is at Tue, Sep 8, 2026, 10:00 AM CDT.",
    );
    expect(answers[2]?.text).toContain("repair_request");
    expect(answers[3]?.text).toContain("$450.00");
    expect(answers[3]?.text).toContain("title_issued");
    expect(answers[4]?.text).toContain("Roof and HVAC");
    expect(answers[5]?.text).toContain("$430,000.00");
    expect(answers[5]?.text).toContain("user_entered");
    expect(answers[6]?.text).toContain("Jordan Hale");
    expect(answers[7]?.text).toBe(
      "Leave for the first showing at Sat, Sep 5, 2026, 2:00 PM CDT.",
    );
    expect(answers.every((answer) => answer.kind !== "refuse")).toBe(true);
  });

  it("shows inspection and showing times as Chicago-local text, never raw ISO", () => {
    const timed = [
      "when is my inspection",
      "when do I leave for my first showing",
    ].map((question) =>
      completeConcierge({ question, facts, otherClientNames: ["Blair Chen"] }),
    );
    for (const answer of timed) {
      expect(answer.kind).toBe("answer");
      expect(containsRawIsoDateTime(answer.text)).toBe(false);
      expect(answer.text).not.toMatch(/T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z/);
      expect(answer.text).toMatch(/\b(CDT|CST)\b/);
    }
  });

  it("refuses another client's transaction and never invents a dollar", () => {
    const refused = completeConcierge({
      question: "What happens next on Blair Chen's file?",
      facts,
      otherClientNames: ["Blair Chen"],
    });
    expect(refused.kind).toBe("refuse");
    expect(refused.text).not.toMatch(/\$/);

    const advice = completeConcierge({
      question: "Should I waive the inspection?",
      facts,
      otherClientNames: ["Blair Chen"],
    });
    expect(advice.kind).toBe("ask_agent");
    expect(advice.text).toContain("Ask my agent");
  });

  it("redacts PII before answering", () => {
    const raw =
      "I live at 814 Maple Ave. SSN 123-45-6789 account 123456789 DOB 01/02/1990";
    expect(containsRawPii(raw)).toBe(true);
    const redacted = redactPii(raw);
    expect(redacted).toContain("[REDACTED_ADDRESS]");
    expect(redacted).toContain("[REDACTED_SSN]");
    expect(redacted).toContain("[REDACTED_ACCOUNT]");
    expect(redacted).toContain("[REDACTED_DOB]");
    expect(containsRawPii(redacted)).toBe(false);

    const answered = completeConcierge({
      question: raw,
      facts,
      otherClientNames: ["Blair Chen"],
    });
    expect(answered.text).not.toContain("814 Maple");
    expect(answered.text).not.toContain("123-45-6789");
  });
});
