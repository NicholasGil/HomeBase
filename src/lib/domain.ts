export const ROLES = [
  "buyer",
  "agent",
  "broker",
  "admin",
  "vendor",
] as const;

export type Role = (typeof ROLES)[number];

export const MONEY_PROVENANCE = [
  "ai_estimate",
  "lender_issued",
  "title_issued",
  "user_entered",
] as const;

export type MoneyProvenance = (typeof MONEY_PROVENANCE)[number];

export type MoneyFigure = {
  amountCents: number;
  currency: "USD";
  provenance: MoneyProvenance;
  asOf: number;
  label?: string;
};

export const DEFAULT_JOURNEY_STAGES = [
  { key: "discovery", label: "Discovery", order: 1 },
  { key: "financing", label: "Financing", order: 2 },
  { key: "favorites", label: "Favorites", order: 3 },
  { key: "showings", label: "Showings", order: 4 },
  { key: "offer", label: "Offer", order: 5 },
  { key: "negotiation", label: "Negotiation", order: 6 },
  { key: "under_contract", label: "Under Contract", order: 7 },
  { key: "inspection", label: "Inspection", order: 8 },
  { key: "appraisal", label: "Appraisal", order: 9 },
  { key: "title", label: "Title", order: 10 },
  { key: "final_walkthrough", label: "Final Walkthrough", order: 11 },
  { key: "closing", label: "Closing", order: 12 },
  { key: "move_in", label: "Move-In", order: 13 },
] as const;

export type JourneyStageKey = (typeof DEFAULT_JOURNEY_STAGES)[number]["key"];

export const TEN_SECOND_QUESTIONS = [
  { key: "where", label: "Where am I", detail: "Current journey stage for this transaction." },
  { key: "done", label: "What's done", detail: "Completed tasks in the current and prior stages." },
  { key: "next", label: "What's next", detail: "The next open task that is not blocked." },
  { key: "waiting", label: "Who am I waiting on", detail: "Assignee role of the next open or blocked task." },
  { key: "owe", label: "What do I owe today", detail: "Issued or estimated figure with provenance." },
] as const;
