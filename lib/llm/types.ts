export const MONEY_PROVENANCE = [
  "ai_estimate",
  "lender_issued",
  "title_issued",
  "user_entered",
] as const;

export type MoneyProvenance = (typeof MONEY_PROVENANCE)[number];

export type ConciergeFact = {
  key: string;
  text: string;
  source: string;
  amountCents?: number;
  provenance?: MoneyProvenance;
};

export type ConciergeAnswer = {
  text: string;
  kind: "answer" | "refuse" | "ask_agent";
  sources: string[];
};

export const CANONICAL_QUESTIONS = [
  "what happens next",
  "when is my inspection",
  "what am I missing",
  "how much cash will I need",
  "what did the inspection find",
  "what changed in the counteroffer",
  "who is my lender",
  "when do I leave for my first showing",
] as const;
