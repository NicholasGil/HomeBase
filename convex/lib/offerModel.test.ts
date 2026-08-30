import { describe, expect, it } from "vitest";

import {
  LICENSEE_REVIEW_REQUIRED,
  STRATEGY_TABLE,
  UNSOURCED_MONEY,
  assertCanSubmit,
  collectScenarioFigures,
  daysOnMarket,
  estimateCashToCloseCents,
  estimateClosingCostsCents,
  estimateLoanCents,
  estimateMonthlyPaymentCents,
  estimatedPosition,
  everyFigureHasProvenance,
  modelAllStrategies,
  moneyFigure,
  offerGate,
} from "./offerModel";

const AS_OF = Date.UTC(2026, 7, 30);

describe("offer model", () => {
  it("models three strategies with tradeoffs and provenance on every dollar", () => {
    const scenarios = modelAllStrategies({
      listPriceCents: 41000000,
      asOf: AS_OF,
    });
    expect(scenarios.map((row) => row.strategy)).toEqual([
      "stronger",
      "balanced",
      "value",
    ]);
    for (const scenario of scenarios) {
      expect(scenario.tradeoffs.length).toBeGreaterThan(0);
      expect(scenario.tradeoffs).toEqual([
        ...STRATEGY_TABLE[scenario.strategy].tradeoffs,
      ]);
      const figures = collectScenarioFigures(scenario);
      expect(figures.length).toBeGreaterThanOrEqual(5);
      expect(everyFigureHasProvenance(figures)).toBe(true);
      expect(
        figures.every((figure) => figure.provenance === "ai_estimate"),
      ).toBe(true);
    }
    const stronger = scenarios[0];
    const value = scenarios[2];
    if (stronger === undefined || value === undefined) {
      throw new Error("missing scenario");
    }
    expect(stronger.terms.price.amountCents).toBeGreaterThan(
      value.terms.price.amountCents,
    );
  });

  it("rejects submit until a licensee id is set", () => {
    expect(() => assertCanSubmit({})).toThrow(LICENSEE_REVIEW_REQUIRED);
    expect(() => assertCanSubmit({ reviewedByLicenseeId: null })).toThrow(
      LICENSEE_REVIEW_REQUIRED,
    );
    expect(() => assertCanSubmit({ reviewedByLicenseeId: "" })).toThrow(
      LICENSEE_REVIEW_REQUIRED,
    );
    expect(() =>
      assertCanSubmit({ reviewedByLicenseeId: "user_licensee" }),
    ).not.toThrow();
    expect(offerGate({ status: "draft" }).reason).toBe(
      "LICENSEE_REVIEW_REQUIRED",
    );
    expect(
      offerGate({
        status: "ready",
        reviewedByLicenseeId: "user_licensee",
      }).canSubmit,
    ).toBe(true);
  });

  it("throws on unsourced money and keeps sample-comp position sourced", () => {
    expect(() =>
      moneyFigure({
        amountCents: Number.NaN,
        provenance: "ai_estimate",
        asOf: AS_OF,
      }),
    ).toThrow(UNSOURCED_MONEY);
    expect(daysOnMarket(AS_OF - 12 * 86_400_000, AS_OF)).toBe(12);
    const position = estimatedPosition({
      listPriceCents: 41000000,
      compSoldCents: [39900000, 41500000],
    });
    expect(position.averageCompCents).toBe(40700000);
    expect(position.vsCompsCents).toBe(300000);
    expect(position.label).toContain("sample comps");
  });

  it("derives loan, closing, cash, and payment from price", () => {
    const loan = estimateLoanCents(41000000, 8200000);
    expect(loan).toBe(32800000);
    const closing = estimateClosingCostsCents(41000000);
    expect(closing).toBe(1230000);
    expect(
      estimateCashToCloseCents({
        downPaymentCents: 8200000,
        closingCostsCents: closing,
        sellerConcessionsCents: 500000,
      }),
    ).toBe(8930000);
    expect(
      estimateMonthlyPaymentCents({
        loanCents: 32800000,
        rateBps: 675,
      }),
    ).toBeGreaterThan(0);
  });
});
