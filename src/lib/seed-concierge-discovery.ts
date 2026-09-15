import type { ConciergeFact } from "../../lib/llm/types";

/** Fixture facts for Path B–style buyers with no property on file yet. */
export function discoveryEmptyConciergeFacts(): ConciergeFact[] {
  return [
    {
      key: "next",
      text:
        "No property is on this file yet. Discovery usually starts with sharing must-haves and touring listings with your agent.",
      source: "journeyStages",
    },
    {
      key: "missing",
      text: "Nothing is marked missing for Discovery on this file.",
      source: "journeyStages.requiredDocuments",
    },
    {
      key: "on_file",
      text:
        "Nothing is on this file yet — no property, documents, tasks, or lender. Coach stays on while you explore.",
      source: "transactions",
    },
  ];
}
