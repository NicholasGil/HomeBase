import type { ConciergeAnswer, ConciergeFact } from "./types";

/** Locked first-session starter labels (Discovery, no property on file). */
export const COACH_FIRST_SESSION_STARTER_KEYS = [
  "next",
  "missing",
  "on_file",
] as const;

export const COACH_FIRST_SESSION_STARTER_LABELS = [
  "What happens next?",
  "What am I missing for this stage?",
  "What's already on my file?",
] as const;

function normalizeStarterLabel(question: string) {
  return question.trim().toLowerCase();
}

export function coachFirstSessionStarterIndex(question: string): number | null {
  const normalized = normalizeStarterLabel(question);
  const index = COACH_FIRST_SESSION_STARTER_LABELS.findIndex(
    (label) => normalizeStarterLabel(label) === normalized,
  );
  return index === -1 ? null : index;
}

export function answerCoachFirstSessionStarter(
  question: string,
  facts: readonly ConciergeFact[],
): ConciergeAnswer | null {
  const index = coachFirstSessionStarterIndex(question);
  if (index === null) {
    return null;
  }
  const key = COACH_FIRST_SESSION_STARTER_KEYS[index];
  const row = facts.find((fact) => fact.key === key);
  if (row === undefined) {
    return null;
  }
  return {
    text: row.text,
    kind: "answer",
    sources: [row.source],
  };
}
