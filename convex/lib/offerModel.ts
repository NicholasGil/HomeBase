export const LICENSEE_REVIEW_REQUIRED = "LICENSEE_REVIEW_REQUIRED";
export const UNSOURCED_MONEY = "UNSOURCED_MONEY";
export const SAMPLE_DATA_LABEL = "sample data";

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

export type FinancingProgram = "conventional" | "fha" | "va" | "cash";
export type InspectionRepairs = "as_is" | "request_repairs" | "credit";
export type OfferStrategy = "stronger" | "balanced" | "value";

export type OfferTerms = {
  price: MoneyFigure;
  earnestMoney?: MoneyFigure;
  sellerConcessions?: MoneyFigure;
  closingDate?: number;
  financing?: {
    program: FinancingProgram;
    downPayment?: MoneyFigure;
    rateBps?: number;
  };
  contingencies?: {
    inspection: boolean;
    financing: boolean;
    appraisal: boolean;
  };
  inspectionTerms?: {
    periodDays: number;
    repairs: InspectionRepairs;
  };
};

export type ModeledOutcome = {
  cashToClose: MoneyFigure;
  monthlyPayment: MoneyFigure;
};

export type ModeledScenario = {
  strategy: OfferStrategy;
  terms: OfferTerms;
  modeledOutcome: ModeledOutcome;
  tradeoffs: string[];
};

export type CompInput = {
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  soldPrice: MoneyFigure;
  soldDate: number;
  specs: {
    beds?: number;
    baths?: number;
    sqft?: number;
  };
  source: string;
};

export type PriceReductionInput = {
  reducedAt: number;
  previousPrice: MoneyFigure;
  newPrice: MoneyFigure;
};

export type StrategyRecipe = {
  priceVsListBps: number;
  earnestBps: number;
  concessionCents: number;
  closeDays: number;
  downPaymentBps: number;
  rateBps: number;
  program: FinancingProgram;
  inspection: boolean;
  financing: boolean;
  appraisal: boolean;
  inspectionDays: number;
  repairs: InspectionRepairs;
  tradeoffs: readonly string[];
};

export const STRATEGY_TABLE = {
  stronger: {
    priceVsListBps: 200,
    earnestBps: 200,
    concessionCents: 0,
    closeDays: 21,
    downPaymentBps: 2000,
    rateBps: 675,
    program: "conventional",
    inspection: true,
    financing: true,
    appraisal: false,
    inspectionDays: 7,
    repairs: "as_is",
    tradeoffs: [
      "Higher price and earnest money aim at competitiveness.",
      "Shorter inspection and no appraisal contingency give the seller more certainty.",
      "Buyer keeps less protection if the house or the loan changes.",
    ],
  },
  balanced: {
    priceVsListBps: 0,
    earnestBps: 100,
    concessionCents: 500000,
    closeDays: 30,
    downPaymentBps: 2000,
    rateBps: 675,
    program: "conventional",
    inspection: true,
    financing: true,
    appraisal: true,
    inspectionDays: 10,
    repairs: "request_repairs",
    tradeoffs: [
      "Price sits at list and keeps standard buyer protections.",
      "A modest seller credit offsets some cash to close.",
      "Competitiveness is middle of the pack against a strong offer.",
    ],
  },
  value: {
    priceVsListBps: -300,
    earnestBps: 50,
    concessionCents: 1000000,
    closeDays: 45,
    downPaymentBps: 1000,
    rateBps: 675,
    program: "conventional",
    inspection: true,
    financing: true,
    appraisal: true,
    inspectionDays: 14,
    repairs: "request_repairs",
    tradeoffs: [
      "Lower price and a larger seller credit improve buyer economics.",
      "Longer close and full contingencies raise rejection risk.",
      "Smaller earnest money leaves more cash uncommitted.",
    ],
  },
} as const satisfies Record<OfferStrategy, StrategyRecipe>;

export const OFFER_STRATEGIES = [
  "stronger",
  "balanced",
  "value",
] as const satisfies readonly OfferStrategy[];

const DAY_MS = 86_400_000;

export const SIMULATOR_FORMULA = {
  closingCostBps: 300,
  annualTaxInsuranceBps: 155,
  termMonths: 360,
} as const;

export type SimulatorFormula = typeof SIMULATOR_FORMULA;

export const SIMULATOR_DERIVED_KEYS = [
  "estimatedLoan",
  "closingCosts",
  "cashToClose",
  "monthlyPayment",
  "monthlyTaxesInsurance",
  "totalMonthly",
] as const;

export type SimulatorDerivedKey = (typeof SIMULATOR_DERIVED_KEYS)[number];

export type OfferSimulationAssumptions = {
  purchasePrice: MoneyFigure;
  downPayment: MoneyFigure;
  sellerConcessions: MoneyFigure;
  rateBps: number;
  program: FinancingProgram;
};

export type OfferSimulation = {
  assumptions: OfferSimulationAssumptions;
  formula: SimulatorFormula;
  derived: Record<SimulatorDerivedKey, MoneyFigure>;
};

export function moneyFigure(input: {
  amountCents: number;
  provenance: MoneyProvenance;
  asOf: number;
  label?: string;
}): MoneyFigure {
  if (!Number.isFinite(input.amountCents)) {
    throw new Error(UNSOURCED_MONEY);
  }
  const figure: MoneyFigure = {
    amountCents: Math.round(input.amountCents),
    currency: "USD",
    provenance: input.provenance,
    asOf: input.asOf,
  };
  if (input.label !== undefined) {
    figure.label = input.label;
  }
  return figure;
}

export function assertMoneyFigure(value: MoneyFigure) {
  if (!Number.isFinite(value.amountCents)) {
    throw new Error(UNSOURCED_MONEY);
  }
  if (value.currency !== "USD") {
    throw new Error(UNSOURCED_MONEY);
  }
  if (!MONEY_PROVENANCE.includes(value.provenance)) {
    throw new Error(UNSOURCED_MONEY);
  }
  return value;
}

export function assertCanSubmit(offer: {
  reviewedByLicenseeId?: string | null;
}) {
  if (
    offer.reviewedByLicenseeId === undefined ||
    offer.reviewedByLicenseeId === null ||
    offer.reviewedByLicenseeId.length === 0
  ) {
    throw new Error(LICENSEE_REVIEW_REQUIRED);
  }
}

export function daysOnMarket(listedAt: number, asOf: number) {
  return Math.max(0, Math.floor((asOf - listedAt) / DAY_MS));
}

export function applyBps(amountCents: number, bps: number) {
  return Math.round((amountCents * bps) / 10_000);
}

export function estimateLoanCents(priceCents: number, downPaymentCents: number) {
  return Math.max(0, priceCents - downPaymentCents);
}

export function estimateClosingCostsCents(priceCents: number) {
  return applyBps(priceCents, SIMULATOR_FORMULA.closingCostBps);
}

export function estimateCashToCloseCents(input: {
  downPaymentCents: number;
  closingCostsCents: number;
  sellerConcessionsCents: number;
}) {
  return Math.max(
    0,
    input.downPaymentCents + input.closingCostsCents - input.sellerConcessionsCents,
  );
}

export function estimateMonthlyTaxesInsuranceCents(priceCents: number) {
  return Math.round(
    applyBps(priceCents, SIMULATOR_FORMULA.annualTaxInsuranceBps) / 12,
  );
}

export function simulateOfferCost(input: {
  purchasePriceCents: number;
  downPaymentCents: number;
  sellerConcessionsCents: number;
  rateBps: number;
  program: FinancingProgram;
  asOf: number;
}): OfferSimulation {
  const purchasePrice = moneyFigure({
    amountCents: input.purchasePriceCents,
    provenance: "user_entered",
    asOf: input.asOf,
    label: "Purchase price assumption",
  });
  const downPayment = moneyFigure({
    amountCents: input.downPaymentCents,
    provenance: "user_entered",
    asOf: input.asOf,
    label: "Down payment assumption",
  });
  const sellerConcessions = moneyFigure({
    amountCents: input.sellerConcessionsCents,
    provenance: "user_entered",
    asOf: input.asOf,
    label: "Seller concessions assumption",
  });
  const loanCents =
    input.program === "cash"
      ? 0
      : estimateLoanCents(input.purchasePriceCents, input.downPaymentCents);
  const closingCostsCents = estimateClosingCostsCents(input.purchasePriceCents);
  const cashToCloseCents = estimateCashToCloseCents({
    downPaymentCents: input.downPaymentCents,
    closingCostsCents,
    sellerConcessionsCents: input.sellerConcessionsCents,
  });
  const monthlyPaymentCents = estimateMonthlyPaymentCents({
    loanCents,
    rateBps: input.rateBps,
  });
  const monthlyTaxesInsuranceCents = estimateMonthlyTaxesInsuranceCents(
    input.purchasePriceCents,
  );
  return {
    assumptions: {
      purchasePrice,
      downPayment,
      sellerConcessions,
      rateBps: input.rateBps,
      program: input.program,
    },
    formula: SIMULATOR_FORMULA,
    derived: {
      estimatedLoan: moneyFigure({
        amountCents: loanCents,
        provenance: "ai_estimate",
        asOf: input.asOf,
        label: "Estimated loan",
      }),
      closingCosts: moneyFigure({
        amountCents: closingCostsCents,
        provenance: "ai_estimate",
        asOf: input.asOf,
        label: "Estimated closing costs",
      }),
      cashToClose: moneyFigure({
        amountCents: cashToCloseCents,
        provenance: "ai_estimate",
        asOf: input.asOf,
        label: "Estimated cash to close",
      }),
      monthlyPayment: moneyFigure({
        amountCents: monthlyPaymentCents,
        provenance: "ai_estimate",
        asOf: input.asOf,
        label: "Estimated monthly principal and interest",
      }),
      monthlyTaxesInsurance: moneyFigure({
        amountCents: monthlyTaxesInsuranceCents,
        provenance: "ai_estimate",
        asOf: input.asOf,
        label: "Estimated monthly taxes and insurance",
      }),
      totalMonthly: moneyFigure({
        amountCents: monthlyPaymentCents + monthlyTaxesInsuranceCents,
        provenance: "ai_estimate",
        asOf: input.asOf,
        label: "Estimated total monthly payment",
      }),
    },
  };
}

export function estimateMonthlyPaymentCents(input: {
  loanCents: number;
  rateBps: number;
  termMonths?: number;
}) {
  const termMonths = input.termMonths ?? SIMULATOR_FORMULA.termMonths;
  if (input.loanCents <= 0) {
    return 0;
  }
  if (input.rateBps <= 0) {
    return Math.round(input.loanCents / termMonths);
  }
  const monthlyRate = input.rateBps / 100 / 12 / 100;
  const factor = (1 + monthlyRate) ** termMonths;
  return Math.round((input.loanCents * monthlyRate * factor) / (factor - 1));
}

export function modeledOutcomeFromTerms(
  terms: OfferTerms,
  asOf: number,
): ModeledOutcome {
  const price = assertMoneyFigure(terms.price).amountCents;
  const downPayment =
    terms.financing?.downPayment?.amountCents ?? applyBps(price, 2000);
  const concessions = terms.sellerConcessions?.amountCents ?? 0;
  const rateBps = terms.financing?.rateBps ?? 675;
  const loanCents =
    terms.financing?.program === "cash"
      ? 0
      : estimateLoanCents(price, downPayment);
  const closingCostsCents = estimateClosingCostsCents(price);
  return {
    cashToClose: moneyFigure({
      amountCents: estimateCashToCloseCents({
        downPaymentCents: downPayment,
        closingCostsCents,
        sellerConcessionsCents: concessions,
      }),
      provenance: "ai_estimate",
      asOf,
      label: "Estimated cash to close",
    }),
    monthlyPayment: moneyFigure({
      amountCents: estimateMonthlyPaymentCents({
        loanCents,
        rateBps,
      }),
      provenance: "ai_estimate",
      asOf,
      label: "Estimated monthly payment",
    }),
  };
}

export function modelStrategy(input: {
  strategy: OfferStrategy;
  listPriceCents: number;
  asOf: number;
}): ModeledScenario {
  const recipe = STRATEGY_TABLE[input.strategy];
  const priceCents = input.listPriceCents + applyBps(input.listPriceCents, recipe.priceVsListBps);
  const downPaymentCents = applyBps(priceCents, recipe.downPaymentBps);
  const terms: OfferTerms = {
    price: moneyFigure({
      amountCents: priceCents,
      provenance: "ai_estimate",
      asOf: input.asOf,
      label: `${titleCase(input.strategy)} price`,
    }),
    earnestMoney: moneyFigure({
      amountCents: applyBps(priceCents, recipe.earnestBps),
      provenance: "ai_estimate",
      asOf: input.asOf,
      label: "Earnest money",
    }),
    sellerConcessions: moneyFigure({
      amountCents: recipe.concessionCents,
      provenance: "ai_estimate",
      asOf: input.asOf,
      label: "Seller concessions",
    }),
    closingDate: input.asOf + recipe.closeDays * DAY_MS,
    financing: {
      program: recipe.program,
      downPayment: moneyFigure({
        amountCents: downPaymentCents,
        provenance: "ai_estimate",
        asOf: input.asOf,
        label: "Down payment",
      }),
      rateBps: recipe.rateBps,
    },
    contingencies: {
      inspection: recipe.inspection,
      financing: recipe.financing,
      appraisal: recipe.appraisal,
    },
    inspectionTerms: {
      periodDays: recipe.inspectionDays,
      repairs: recipe.repairs,
    },
  };
  return {
    strategy: input.strategy,
    terms,
    modeledOutcome: modeledOutcomeFromTerms(terms, input.asOf),
    tradeoffs: [...recipe.tradeoffs],
  };
}

export function modelAllStrategies(input: {
  listPriceCents: number;
  asOf: number;
}): ModeledScenario[] {
  return OFFER_STRATEGIES.map((strategy) =>
    modelStrategy({
      strategy,
      listPriceCents: input.listPriceCents,
      asOf: input.asOf,
    }),
  );
}

export function estimatedPosition(input: {
  listPriceCents: number;
  compSoldCents: readonly number[];
}) {
  if (input.compSoldCents.length === 0) {
    return {
      label: "No sample comps on file",
      vsCompsCents: 0,
      averageCompCents: null as number | null,
    };
  }
  const averageCompCents = Math.round(
    input.compSoldCents.reduce((sum, value) => sum + value, 0) /
      input.compSoldCents.length,
  );
  const vsCompsCents = input.listPriceCents - averageCompCents;
  if (vsCompsCents > 0) {
    return {
      label: "Above recent sample comps",
      vsCompsCents,
      averageCompCents,
    };
  }
  if (vsCompsCents < 0) {
    return {
      label: "Below recent sample comps",
      vsCompsCents,
      averageCompCents,
    };
  }
  return {
    label: "In line with recent sample comps",
    vsCompsCents,
    averageCompCents,
  };
}

export function offerGate(offer: {
  reviewedByLicenseeId?: string | null;
  submittedAt?: number | null;
  status: string;
}) {
  if (
    offer.status === "submitted" ||
    (offer.submittedAt !== undefined && offer.submittedAt !== null)
  ) {
    return {
      canSubmit: false,
      reason: "already_submitted" as const,
    };
  }
  if (
    offer.reviewedByLicenseeId === undefined ||
    offer.reviewedByLicenseeId === null ||
    offer.reviewedByLicenseeId.length === 0
  ) {
    return {
      canSubmit: false,
      reason: "LICENSEE_REVIEW_REQUIRED" as const,
    };
  }
  return {
    canSubmit: true,
    reason: "ready" as const,
  };
}

function titleCase(strategy: OfferStrategy) {
  switch (strategy) {
    case "stronger":
      return "Stronger";
    case "balanced":
      return "Balanced";
    case "value":
      return "Value";
    default: {
      const _exhaustive: never = strategy;
      return _exhaustive;
    }
  }
}

export function everyFigureHasProvenance(figures: readonly MoneyFigure[]) {
  return figures.every((figure) => {
    try {
      assertMoneyFigure(figure);
      return true;
    } catch {
      return false;
    }
  });
}

export function collectScenarioFigures(scenario: ModeledScenario): MoneyFigure[] {
  const figures = [
    scenario.terms.price,
    scenario.modeledOutcome.cashToClose,
    scenario.modeledOutcome.monthlyPayment,
  ];
  if (scenario.terms.earnestMoney !== undefined) {
    figures.push(scenario.terms.earnestMoney);
  }
  if (scenario.terms.sellerConcessions !== undefined) {
    figures.push(scenario.terms.sellerConcessions);
  }
  if (scenario.terms.financing?.downPayment !== undefined) {
    figures.push(scenario.terms.financing.downPayment);
  }
  return figures;
}
