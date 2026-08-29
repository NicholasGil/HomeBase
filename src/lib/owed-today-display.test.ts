import { describe, expect, it } from "vitest";

import {
  ESTIMATE_AMOUNT_CLASS_NAME,
  ESTIMATE_LABEL,
  ISSUED_AMOUNT_CLASS_NAME,
  MISSING_OWED_TODAY_TEXT,
  owedTodayDisplay,
} from "@/lib/owed-today-display";

describe("owedTodayDisplay", () => {
  it("does not invent a dollar amount when owedToday is null or missing", () => {
    const missing = owedTodayDisplay(null);
    const absent = owedTodayDisplay(undefined);

    expect(missing.kind).toBe("missing");
    expect(missing.amountText).toBe(MISSING_OWED_TODAY_TEXT);
    expect(missing.amountText).toBe("None");
    expect(missing.amountText).not.toMatch(/\$/);
    expect(missing.estimateLabel).toBeNull();
    expect(JSON.stringify(missing)).not.toContain("$0.00");

    expect(absent.kind).toBe("missing");
    expect(absent.amountText).toBe("None");
    expect(JSON.stringify(absent)).not.toContain("$0.00");
  });

  it("mutes unofficial figures and labels them ESTIMATE", () => {
    const ai = owedTodayDisplay({
      amountCents: 120000,
      currency: "USD",
      provenance: "ai_estimate",
      asOf: 0,
    });
    const entered = owedTodayDisplay({
      amountCents: 0,
      currency: "USD",
      provenance: "user_entered",
      asOf: 0,
      label: "Nothing due today",
    });

    expect(ai.kind).toBe("estimate");
    expect(entered.kind).toBe("estimate");
    if (ai.kind === "estimate" && entered.kind === "estimate") {
      expect(ai.amountText).toBe("$1,200.00");
      expect(entered.amountText).toBe("$0.00");
      expect(ai.estimateLabel).toBe(ESTIMATE_LABEL);
      expect(entered.estimateLabel).toBe(ESTIMATE_LABEL);
      expect(ai.amountClassName).toBe(ESTIMATE_AMOUNT_CLASS_NAME);
      expect(entered.amountClassName).toBe(ESTIMATE_AMOUNT_CLASS_NAME);
      expect(ai.amountClassName).toContain("text-muted-foreground");
      expect(ai.amountClassName).not.toBe(ISSUED_AMOUNT_CLASS_NAME);
    }
  });

  it("keeps issued figures full-weight and unlabeled as estimates", () => {
    const issued = owedTodayDisplay({
      amountCents: 45000,
      currency: "USD",
      provenance: "title_issued",
      asOf: 0,
      label: "Inspection invoice due today",
    });

    expect(issued.kind).toBe("issued");
    if (issued.kind === "issued") {
      expect(issued.amountText).toBe("$450.00");
      expect(issued.provenance).toBe("title_issued");
      expect(issued.estimateLabel).toBeNull();
      expect(issued.amountClassName).toBe(ISSUED_AMOUNT_CLASS_NAME);
      expect(issued.amountClassName).toContain("font-semibold");
      expect(issued.amountClassName).not.toContain("text-muted-foreground");
      expect(issued.amountClassName).not.toBe(ESTIMATE_AMOUNT_CLASS_NAME);
    }
  });
});
