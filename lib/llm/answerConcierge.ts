import { applyGuardrails, formatUsd, looksLikeAdvice } from "./guardrails";
import type { ConciergeAnswer, ConciergeFact } from "./types";

function fact(facts: readonly ConciergeFact[], key: string) {
  return facts.find((row) => row.key === key) ?? null;
}

function moneyLine(row: ConciergeFact) {
  if (row.amountCents === undefined || row.provenance === undefined) {
    return row.text;
  }
  const amount = formatUsd(row.amountCents);
  const estimate =
    row.provenance === "ai_estimate" || row.provenance === "user_entered"
      ? " ESTIMATE"
      : "";
  return `${row.text} ${amount}${estimate} (${row.provenance}, ${row.source})`;
}

export function answerConcierge(
  question: string,
  facts: readonly ConciergeFact[],
): ConciergeAnswer {
  const normalized = question.trim().toLowerCase();

  if (looksLikeAdvice(question)) {
    return {
      text: "Ask my agent. That question is about strategy, price, or legal meaning.",
      kind: "ask_agent",
      sources: [],
    };
  }

  const next = fact(facts, "next");
  const inspectionWhen = fact(facts, "inspection_when");
  const missing = fact(facts, "missing");
  const cash = fact(facts, "cash");
  const inspectionFind = fact(facts, "inspection_findings");
  const counter = fact(facts, "counteroffer");
  const lender = fact(facts, "lender");
  const showing = fact(facts, "first_showing");

  let answer: ConciergeAnswer | null = null;

  if (normalized.includes("happen") && normalized.includes("next")) {
    answer = next
      ? { text: next.text, kind: "answer", sources: [next.source] }
      : {
          text: "No next open task is on this file.",
          kind: "answer",
          sources: [],
        };
  } else if (normalized.includes("when") && normalized.includes("inspection")) {
    answer = inspectionWhen
      ? {
          text: inspectionWhen.text,
          kind: "answer",
          sources: [inspectionWhen.source],
        }
      : {
          text: "No inspection time is on this file.",
          kind: "answer",
          sources: [],
        };
  } else if (normalized.includes("missing")) {
    answer = missing
      ? { text: missing.text, kind: "answer", sources: [missing.source] }
      : {
          text: "Nothing required is marked missing on this stage.",
          kind: "answer",
          sources: [],
        };
  } else if (
    normalized.includes("cash") ||
    (normalized.includes("how much") && normalized.includes("need"))
  ) {
    answer = cash
      ? {
          text: moneyLine(cash),
          kind: "answer",
          sources: [cash.source],
        }
      : {
          text: "No sourced cash figure is on this file. Ask my agent if you need one issued.",
          kind: "ask_agent",
          sources: [],
        };
  } else if (
    normalized.includes("inspection") &&
    (normalized.includes("find") || normalized.includes("found"))
  ) {
    answer = inspectionFind
      ? {
          text: inspectionFind.text,
          kind: "answer",
          sources: [inspectionFind.source],
        }
      : {
          text: "No inspection findings are on this file.",
          kind: "answer",
          sources: [],
        };
  } else if (
    normalized.includes("counter") ||
    (normalized.includes("changed") && normalized.includes("offer"))
  ) {
    answer = counter
      ? { text: moneyLine(counter), kind: "answer", sources: [counter.source] }
      : {
          text: "No counteroffer is on this file.",
          kind: "answer",
          sources: [],
        };
  } else if (normalized.includes("lender")) {
    answer = lender
      ? { text: lender.text, kind: "answer", sources: [lender.source] }
      : {
          text: "No lender is on this file.",
          kind: "answer",
          sources: [],
        };
  } else if (
    normalized.includes("showing") ||
    (normalized.includes("leave") && normalized.includes("first"))
  ) {
    answer = showing
      ? { text: showing.text, kind: "answer", sources: [showing.source] }
      : {
          text: "No showing departure time is on this file.",
          kind: "answer",
          sources: [],
        };
  }

  if (answer === null) {
    answer = {
      text: "I can explain facts on this transaction. Ask my agent for strategy, price, or legal meaning.",
      kind: "ask_agent",
      sources: [],
    };
  }

  return applyGuardrails(answer, facts);
}
