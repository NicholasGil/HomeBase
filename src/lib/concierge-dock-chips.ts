import { COACH_FIRST_SESSION_STARTER_LABELS } from "../../lib/llm/coachFirstSession";
import {
  CONCIERGE_STARTERS,
  FILE_SESSION_DOCK_PREVIEW_COUNT,
} from "@/lib/concierge-starters";

export type ConciergeDockChip = {
  label: string;
  question: string;
};

export const FILE_SESSION_DOCK_CHIPS: readonly ConciergeDockChip[] = [
  { label: "What's next?", question: "What happens next?" },
  { label: "My inspection?", question: "When is my inspection?" },
];

export const DISCOVERY_DOCK_CHIPS: readonly ConciergeDockChip[] = [
  { label: "What's next?", question: COACH_FIRST_SESSION_STARTER_LABELS[0] },
  {
    label: "What's missing?",
    question: COACH_FIRST_SESSION_STARTER_LABELS[1],
  },
];

function questionByLabel(
  chips: readonly ConciergeDockChip[],
): Map<string, string> {
  return new Map(chips.map((chip) => [chip.label, chip.question]));
}

const fileDockQuestionByLabel = questionByLabel(FILE_SESSION_DOCK_CHIPS);
const discoveryDockQuestionByLabel = questionByLabel(DISCOVERY_DOCK_CHIPS);

const conciergeQuestionByCanonical = new Map<string, string>(
  CONCIERGE_STARTERS.map((question) => [question, question]),
);
for (const chip of FILE_SESSION_DOCK_CHIPS) {
  conciergeQuestionByCanonical.set(chip.label, chip.question);
}

const discoveryQuestionByCanonical = new Map<string, string>(
  COACH_FIRST_SESSION_STARTER_LABELS.map((question) => [question, question]),
);
for (const chip of DISCOVERY_DOCK_CHIPS) {
  discoveryQuestionByCanonical.set(chip.label, chip.question);
}

export function fileSessionDockPreviewLabels(): string[] {
  return FILE_SESSION_DOCK_CHIPS.slice(0, FILE_SESSION_DOCK_PREVIEW_COUNT).map(
    (chip) => chip.label,
  );
}

export function discoveryDockPreviewLabels(): string[] {
  return DISCOVERY_DOCK_CHIPS.slice(0, FILE_SESSION_DOCK_PREVIEW_COUNT).map(
    (chip) => chip.label,
  );
}

export function resolveFileSessionDockQuestion(labelOrQuestion: string): string {
  return (
    fileDockQuestionByLabel.get(labelOrQuestion) ??
    conciergeQuestionByCanonical.get(labelOrQuestion) ??
    labelOrQuestion
  );
}

export function resolveDiscoveryDockQuestion(labelOrQuestion: string): string {
  return (
    discoveryDockQuestionByLabel.get(labelOrQuestion) ??
    discoveryQuestionByCanonical.get(labelOrQuestion) ??
    labelOrQuestion
  );
}
