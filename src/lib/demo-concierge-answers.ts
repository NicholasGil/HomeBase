import type { ConciergeAnswer, ConciergeFact } from "../../lib/llm/types";
import { formatDisplayDateTime } from "../../convex/lib/displayTime";
import { SEED_CONCIERGE, SEED_PLAN } from "../../convex/seedPlan";

const AGENT_NAME = SEED_PLAN.agent.name;

function fact(facts: readonly ConciergeFact[], key: string) {
  return facts.find((row) => row.key === key) ?? null;
}

/** Richer 2–3 line demo copy from seed facts only (fixture file session). */
export function enrichDemoFileSessionAnswer(
  question: string,
  answer: ConciergeAnswer,
  facts: readonly ConciergeFact[],
): ConciergeAnswer {
  if (answer.kind !== "answer") {
    return answer;
  }

  const normalized = question.trim().toLowerCase();
  const inspectionWhen = fact(facts, "inspection_when");
  const missing = fact(facts, "missing");
  const missingItem = missing?.text.replace(/^Missing for [^:]+:\s*/i, "") ?? null;

  if (normalized.includes("happen") && normalized.includes("next")) {
    return {
      ...answer,
      text: `${AGENT_NAME} is assigned to schedule your inspection — that's the open next task on this file.\nYou're in the Inspection stage; nothing else is queued ahead of that.`,
      sources: answer.sources,
    };
  }

  if (normalized.includes("inspection")) {
    const when =
      inspectionWhen?.text ??
      `Inspection is at ${formatDisplayDateTime(SEED_CONCIERGE.inspectionStartsAt)}.`;
    const bring =
      "Bring photo ID, utility access, and any repair notes you already have.";
    const gap = missingItem
      ? `\nThe file still needs ${missingItem} before this stage clears.`
      : "";
    return {
      ...answer,
      text: `${when}\n${bring}${gap}`,
      sources: answer.sources,
    };
  }

  if (normalized.includes("missing")) {
    const line = missingItem
      ? `Still missing for Inspection: ${missingItem}.`
      : "Nothing required is marked missing on this stage.";
    return {
      ...answer,
      text: `${line}\n${AGENT_NAME} can confirm once it's uploaded to your vault.`,
      sources: answer.sources,
    };
  }

  return answer;
}
