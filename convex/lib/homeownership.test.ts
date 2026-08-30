import { describe, expect, it } from "vitest";

import {
  assertClosedHub,
  hubValueSlots,
  isClosedTransactionStatus,
  toListedHubDocument,
} from "./homeownership";
import { moneyFigure } from "./offerModel";

describe("homeownership hub gates", () => {
  it("treats only closed status as a hub", () => {
    expect(isClosedTransactionStatus("closed")).toBe(true);
    expect(isClosedTransactionStatus("active")).toBe(false);
    expect(isClosedTransactionStatus("paused")).toBe(false);
    expect(() => assertClosedHub("active")).toThrow("FORBIDDEN");
    expect(() => assertClosedHub("closed")).not.toThrow();
  });

  it("strips extractedSummary from listed hub documents", () => {
    const listed = toListedHubDocument({
      _id: "doc-1",
      type: "closing_disclosure",
      status: "summarized",
      extractedSummary: "Secret closing figures.",
    });
    expect(listed).toEqual({
      id: "doc-1",
      type: "closing_disclosure",
      status: "summarized",
    });
    expect(listed).not.toHaveProperty("extractedSummary");
  });

  it("keeps a missing value slot null instead of a zero figure", () => {
    const slots = hubValueSlots({
      issued: moneyFigure({
        amountCents: 40500000,
        provenance: "title_issued",
        asOf: 0,
        label: "Purchase price at close",
      }),
      estimated: moneyFigure({
        amountCents: 41200000,
        provenance: "ai_estimate",
        asOf: 0,
        label: "Modeled market value",
      }),
      taxAssessed: null,
    });
    expect(slots[2]?.key).toBe("taxAssessed");
    expect(slots[2]?.figure).toBeNull();
    expect(slots[0]?.figure?.provenance).toBe("title_issued");
    expect(slots[1]?.figure?.provenance).toBe("ai_estimate");
  });
});
