import type { ConciergeFact } from "./types";

/** Facts for buyers in Discovery with no property on file yet (fixture + live). */
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

export function isDiscoveryEmptyConciergeFacts(
  facts: readonly ConciergeFact[],
): boolean {
  if (facts.length !== 3) {
    return false;
  }
  const keys = new Set(facts.map((row) => row.key));
  return keys.has("next") && keys.has("missing") && keys.has("on_file");
}
