/**
 * Canonical concierge starter questions (DESIGN.md §M3). Shared by server and
 * client — keep out of "use client" modules so fixture coach can pass slices.
 */
export const CONCIERGE_STARTERS = [
  "What happens next?",
  "When is my inspection?",
  "What am I missing?",
  "How much cash will I need?",
  "What did the inspection find?",
  "What changed in the counteroffer?",
  "Who is my lender?",
  "When do I leave for my first showing?",
] as const;

export const FILE_SESSION_CONCIERGE_STARTERS = [
  "What happens next?",
  "When is my inspection and what should I bring?",
  "What am I missing?",
] as const;
