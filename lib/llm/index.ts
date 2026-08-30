import { readFileSync } from "node:fs";
import path from "node:path";

import { answerConcierge } from "./answerConcierge";
import { asksAboutAnotherClient } from "./guardrails";
import { redactPii } from "./redact";
import type { ConciergeAnswer, ConciergeFact } from "./types";

export { answerConcierge } from "./answerConcierge";
export { redactPii } from "./redact";
export type { ConciergeAnswer, ConciergeFact } from "./types";
export { CANONICAL_QUESTIONS } from "./types";

const PROMPT_FILES = {
  "concierge.v1": "prompts/concierge.v1.txt",
} as const;

export type PromptId = keyof typeof PROMPT_FILES;

export function loadPrompt(id: PromptId) {
  return readFileSync(
    path.join(process.cwd(), "lib/llm", PROMPT_FILES[id]),
    "utf8",
  );
}

export function completeConcierge(input: {
  question: string;
  facts: readonly ConciergeFact[];
  otherClientNames?: readonly string[];
}): ConciergeAnswer {
  const question = redactPii(input.question);
  const facts = input.facts.map((fact) => ({
    ...fact,
    text: redactPii(fact.text),
  }));

  if (
    asksAboutAnotherClient(question) ||
    (input.otherClientNames ?? []).some((name) =>
      question.toLowerCase().includes(name.toLowerCase()),
    )
  ) {
    return {
      text: "I can only talk about this transaction. I will not answer questions about another client's file.",
      kind: "refuse",
      sources: [],
    };
  }

  void loadPrompt("concierge.v1");
  return answerConcierge(question, facts);
}
