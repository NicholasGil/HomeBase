import type { DashboardMoney } from "../../convex/lib/dashboardView";

export const MISSING_OWED_TODAY_TEXT = "None";
export const ESTIMATE_LABEL = "ESTIMATE";
export const ISSUED_AMOUNT_CLASS_NAME =
  "font-mono text-4xl font-semibold tracking-tight tabular-nums";
export const ESTIMATE_AMOUNT_CLASS_NAME =
  "text-3xl font-normal text-sage-foreground italic tabular-nums";

export type OwedTodayDisplay =
  | {
      kind: "missing";
      amountText: typeof MISSING_OWED_TODAY_TEXT;
      amountClassName: "text-lg text-muted-foreground";
      estimateLabel: null;
      provenance: null;
    }
  | {
      kind: "issued";
      amountText: string;
      amountClassName: typeof ISSUED_AMOUNT_CLASS_NAME;
      estimateLabel: null;
      provenance: Extract<
        DashboardMoney["provenance"],
        "lender_issued" | "title_issued"
      >;
    }
  | {
      kind: "estimate";
      amountText: string;
      amountClassName: typeof ESTIMATE_AMOUNT_CLASS_NAME;
      estimateLabel: typeof ESTIMATE_LABEL;
      provenance: Extract<
        DashboardMoney["provenance"],
        "ai_estimate" | "user_entered"
      >;
    };

export function formatUsd(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

export function owedTodayDisplay(
  owed: DashboardMoney | null | undefined,
): OwedTodayDisplay {
  if (owed === null || owed === undefined) {
    return {
      kind: "missing",
      amountText: MISSING_OWED_TODAY_TEXT,
      amountClassName: "text-lg text-muted-foreground",
      estimateLabel: null,
      provenance: null,
    };
  }

  const amountText = formatUsd(owed.amountCents);
  switch (owed.provenance) {
    case "lender_issued":
    case "title_issued":
      return {
        kind: "issued",
        amountText,
        amountClassName: ISSUED_AMOUNT_CLASS_NAME,
        estimateLabel: null,
        provenance: owed.provenance,
      };
    case "ai_estimate":
    case "user_entered":
      return {
        kind: "estimate",
        amountText,
        amountClassName: ESTIMATE_AMOUNT_CLASS_NAME,
        estimateLabel: ESTIMATE_LABEL,
        provenance: owed.provenance,
      };
    default: {
      const _exhaustive: never = owed.provenance;
      return _exhaustive;
    }
  }
}
