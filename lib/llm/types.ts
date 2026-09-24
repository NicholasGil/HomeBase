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
  kind: "answer" | "refuse" | "ask_agent" | "unavailable";
  sources: string[];
};

export const CONCIERGE_MODEL_UNAVAILABLE_ANSWER: ConciergeAnswer = {
  kind: "unavailable",
  text:
    "AI coach unavailable — model key not configured. You can still read your journey and documents on this file. Contact your agent if one is on file, or try again later.",
  sources: [],
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
