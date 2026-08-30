export const DAY_MS = 86_400_000;

export const FINANCING_DOCUMENT_TYPES = ["preapproval"] as const;

export const COMMAND_CENTER_EXCEPTION_KINDS = [
  "missing_financing_document",
  "inspection_due_tomorrow",
  "offer_awaiting_response",
  "closing_this_week",
] as const;

export type CommandCenterExceptionKind =
  (typeof COMMAND_CENTER_EXCEPTION_KINDS)[number];

export type CommandCenterException = {
  kind: CommandCenterExceptionKind;
  label: string;
};

export type CommandCenterClient = {
  clientId: string;
  transactionId: string;
  name: string;
  stage: string;
  stageLabel: string;
  stageOrder: number;
  status: string;
  exceptions: CommandCenterException[];
  priorityScore: number;
  priorityReason: string;
  nextTask: { title: string; assigneeRole: string } | null;
  propertyCity: string | null;
  propertyState: string | null;
  missingDocumentTypes: string[];
};

export type CommandCenterView = {
  roster: CommandCenterClient[];
  priority: CommandCenterClient[];
};

export type CommandCenterClientInput = {
  clientId: string;
  transactionId: string;
  name: string;
  stage: string;
  stageLabel: string;
  stageOrder: number;
  status: string;
  documentTypes: readonly string[];
  financingRequired?: readonly string[];
  inspectionDueAt?: number;
  closingAt?: number;
  offerStatus?: string;
  nextTask: { title: string; assigneeRole: string } | null;
  propertyCity: string | null;
  propertyState: string | null;
};

export const EXCEPTION_LABELS = {
  missing_financing_document: "Missing financing document",
  inspection_due_tomorrow: "Inspection due tomorrow",
  offer_awaiting_response: "Offer awaiting response",
  closing_this_week: "Closing this week",
} as const satisfies Record<CommandCenterExceptionKind, string>;

export const EXCEPTION_REASONS = {
  missing_financing_document: "Financing file is missing the preapproval.",
  inspection_due_tomorrow: "Inspection is due tomorrow.",
  offer_awaiting_response: "Offer is awaiting a response.",
  closing_this_week: "Closing is this week.",
} as const satisfies Record<CommandCenterExceptionKind, string>;

export const EXCEPTION_WEIGHT = {
  missing_financing_document: 400,
  inspection_due_tomorrow: 300,
  offer_awaiting_response: 200,
  closing_this_week: 100,
} as const satisfies Record<CommandCenterExceptionKind, number>;

export function startOfUtcDay(at: number) {
  const date = new Date(at);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function isUtcTomorrow(at: number, now: number) {
  const tomorrow = startOfUtcDay(now) + DAY_MS;
  return at >= tomorrow && at < tomorrow + DAY_MS;
}

export function isWithinUpcomingDays(at: number, now: number, days: number) {
  return at >= now && at < now + days * DAY_MS;
}

export function priorityReasonFor(
  exceptions: readonly CommandCenterExceptionKind[],
  stageLabel: string,
) {
  const first = exceptions[0];
  if (first === undefined) {
    return `${stageLabel}. No exception on this file.`;
  }
  return EXCEPTION_REASONS[first];
}

export function detectExceptions(input: {
  stage: string;
  documentTypes: readonly string[];
  financingRequired?: readonly string[];
  inspectionDueAt?: number;
  closingAt?: number;
  offerStatus?: string;
  now: number;
}): CommandCenterException[] {
  const exceptions: CommandCenterException[] = [];
  const present = new Set(input.documentTypes);
  const required = input.financingRequired ?? FINANCING_DOCUMENT_TYPES;
  const missing = required.filter((type) => !present.has(type));

  if (input.stage === "financing" && missing.length > 0) {
    exceptions.push({
      kind: "missing_financing_document",
      label: EXCEPTION_LABELS.missing_financing_document,
    });
  }
  if (
    input.inspectionDueAt !== undefined &&
    isUtcTomorrow(input.inspectionDueAt, input.now)
  ) {
    exceptions.push({
      kind: "inspection_due_tomorrow",
      label: EXCEPTION_LABELS.inspection_due_tomorrow,
    });
  }
  if (input.offerStatus === "submitted") {
    exceptions.push({
      kind: "offer_awaiting_response",
      label: EXCEPTION_LABELS.offer_awaiting_response,
    });
  }
  if (
    input.closingAt !== undefined &&
    isWithinUpcomingDays(input.closingAt, input.now, 7)
  ) {
    exceptions.push({
      kind: "closing_this_week",
      label: EXCEPTION_LABELS.closing_this_week,
    });
  }
  return exceptions;
}

export function scoreExceptions(
  exceptions: readonly CommandCenterException[],
) {
  return exceptions.reduce(
    (score, exception) => Math.max(score, EXCEPTION_WEIGHT[exception.kind]),
    0,
  );
}

export function compareCommandCenterClients(
  left: CommandCenterClient,
  right: CommandCenterClient,
) {
  if (left.priorityScore !== right.priorityScore) {
    return right.priorityScore - left.priorityScore;
  }
  if (left.stageOrder !== right.stageOrder) {
    return right.stageOrder - left.stageOrder;
  }
  return left.name.localeCompare(right.name);
}

export function buildCommandCenterClient(
  input: CommandCenterClientInput,
  now: number,
): CommandCenterClient {
  const financingRequired = input.financingRequired ?? FINANCING_DOCUMENT_TYPES;
  const present = new Set(input.documentTypes);
  const missingDocumentTypes =
    input.stage === "financing"
      ? financingRequired.filter((type) => !present.has(type))
      : [];
  const exceptions = detectExceptions({
    stage: input.stage,
    documentTypes: input.documentTypes,
    financingRequired,
    inspectionDueAt: input.inspectionDueAt,
    closingAt: input.closingAt,
    offerStatus: input.offerStatus,
    now,
  });
  return {
    clientId: input.clientId,
    transactionId: input.transactionId,
    name: input.name,
    stage: input.stage,
    stageLabel: input.stageLabel,
    stageOrder: input.stageOrder,
    status: input.status,
    exceptions,
    priorityScore: scoreExceptions(exceptions),
    priorityReason: priorityReasonFor(
      exceptions.map((exception) => exception.kind),
      input.stageLabel,
    ),
    nextTask: input.nextTask,
    propertyCity: input.propertyCity,
    propertyState: input.propertyState,
    missingDocumentTypes: [...missingDocumentTypes],
  };
}

export function buildCommandCenter(
  inputs: readonly CommandCenterClientInput[],
  now: number,
): CommandCenterView {
  const clients = inputs.map((input) => buildCommandCenterClient(input, now));
  return {
    roster: [...clients].sort((left, right) => left.name.localeCompare(right.name)),
    priority: [...clients].sort(compareCommandCenterClients),
  };
}
