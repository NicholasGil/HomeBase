import { describe, expect, it } from "vitest";

import {
  buildCommandCenter,
  detectExceptions,
  isUtcTomorrow,
  type CommandCenterClientInput,
} from "./commandCenter";

const NOW = Date.UTC(2026, 7, 30, 13, 0, 0);

function client(
  overrides: Partial<CommandCenterClientInput> &
    Pick<CommandCenterClientInput, "name" | "stage" | "stageLabel" | "stageOrder">,
): CommandCenterClientInput {
  return {
    clientId: overrides.clientId ?? overrides.name,
    transactionId: overrides.transactionId ?? `tx:${overrides.name}`,
    status: overrides.status ?? "active",
    documentTypes: overrides.documentTypes ?? [],
    nextTask: overrides.nextTask ?? null,
    propertyCity: overrides.propertyCity ?? "Huntsville",
    propertyState: overrides.propertyState ?? "AL",
    ...overrides,
  };
}

describe("command center ranking", () => {
  it("treats a timestamp on the next UTC day as tomorrow", () => {
    expect(isUtcTomorrow(NOW + 86_400_000, NOW)).toBe(true);
    expect(isUtcTomorrow(NOW + 2 * 86_400_000, NOW)).toBe(false);
  });

  it("detects the four DESIGN.md exception kinds", () => {
    expect(
      detectExceptions({
        stage: "financing",
        documentTypes: [],
        now: NOW,
      }).map((row) => row.kind),
    ).toEqual(["missing_financing_document"]);
    expect(
      detectExceptions({
        stage: "inspection",
        documentTypes: ["inspection_report"],
        inspectionDueAt: NOW + 86_400_000,
        now: NOW,
      }).map((row) => row.kind),
    ).toEqual(["inspection_due_tomorrow"]);
    expect(
      detectExceptions({
        stage: "offer",
        documentTypes: ["preapproval"],
        offerStatus: "submitted",
        now: NOW,
      }).map((row) => row.kind),
    ).toEqual(["offer_awaiting_response"]);
    expect(
      detectExceptions({
        stage: "closing",
        documentTypes: ["purchase_agreement"],
        closingAt: NOW + 3 * 86_400_000,
        now: NOW,
      }).map((row) => row.kind),
    ).toEqual(["closing_this_week"]);
  });

  it("does not treat a draft offer or a later closing as an exception", () => {
    expect(
      detectExceptions({
        stage: "offer",
        documentTypes: ["preapproval"],
        offerStatus: "draft",
        now: NOW,
      }),
    ).toEqual([]);
    expect(
      detectExceptions({
        stage: "closing",
        documentTypes: ["purchase_agreement"],
        closingAt: NOW + 21 * 86_400_000,
        now: NOW,
      }),
    ).toEqual([]);
  });

  it("puts the two exception clients first", () => {
    const view = buildCommandCenter(
      [
        client({
          name: "Blair Chen",
          stage: "showings",
          stageLabel: "Showings",
          stageOrder: 4,
          documentTypes: [],
        }),
        client({
          name: "Dana Ortiz",
          stage: "financing",
          stageLabel: "Financing",
          stageOrder: 2,
          documentTypes: [],
        }),
        client({
          name: "Ellis Park",
          stage: "inspection",
          stageLabel: "Inspection",
          stageOrder: 8,
          documentTypes: ["inspection_report"],
          inspectionDueAt: NOW + 86_400_000,
        }),
        client({
          name: "Alex Rivera",
          stage: "inspection",
          stageLabel: "Inspection",
          stageOrder: 8,
          documentTypes: ["preapproval", "inspection_report"],
          inspectionDueAt: NOW + 2 * 86_400_000,
        }),
      ],
      NOW,
    );
    expect(view.priority.map((row) => row.name)).toEqual([
      "Dana Ortiz",
      "Ellis Park",
      "Alex Rivera",
      "Blair Chen",
    ]);
    expect(view.priority[0]?.exceptions[0]?.kind).toBe(
      "missing_financing_document",
    );
    expect(view.priority[1]?.exceptions[0]?.kind).toBe(
      "inspection_due_tomorrow",
    );
    expect(view.roster.map((row) => row.name)).toEqual([
      "Alex Rivera",
      "Blair Chen",
      "Dana Ortiz",
      "Ellis Park",
    ]);
  });
});
