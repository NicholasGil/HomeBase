import { describe, expect, it } from "vitest";

import { owedTodayDisplay } from "@/lib/owed-today-display";

describe("owedTodayDisplay", () => {
  it("does not render $0.00 when owedToday is null or missing", () => {
    const missing = owedTodayDisplay(null);
    const absent = owedTodayDisplay(undefined);

    expect(missing.kind).toBe("missing");
    expect(missing.amountText).toBeNull();
    expect(missing.provenance).toBeNull();
    expect(missing.statusLabel).toBe("Not yet issued");
    expect(JSON.stringify(missing)).not.toContain("$0.00");

    expect(absent.kind).toBe("missing");
    expect(JSON.stringify(absent)).not.toContain("$0.00");
  });

  it("keeps provenance on issued and estimate figures", () => {
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
      expect(issued.statusLabel).toBe("Issued");
    }

    const estimate = owedTodayDisplay({
      amountCents: 120000,
      currency: "USD",
      provenance: "ai_estimate",
      asOf: 0,
    });
    expect(estimate.kind).toBe("estimate");
    if (estimate.kind === "estimate") {
      expect(estimate.statusLabel).toBe("ESTIMATE");
      expect(estimate.provenance).toBe("ai_estimate");
      expect(estimate.amountText).toBe("$1,200.00");
    }
  });

  it("can show a sourced zero without treating it as missing", () => {
    const zero = owedTodayDisplay({
      amountCents: 0,
      currency: "USD",
      provenance: "user_entered",
      asOf: 0,
      label: "Nothing due today",
    });
    expect(zero.kind).toBe("estimate");
    if (zero.kind === "estimate") {
      expect(zero.amountText).toBe("$0.00");
      expect(zero.provenance).toBe("user_entered");
      expect(zero.statusLabel).toBe("Entered");
    }
  });
});
