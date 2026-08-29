import type { DashboardMoney } from "../../convex/lib/dashboardView";

export type OwedTodayDisplay =
  | {
      kind: "missing";
      amountText: null;
      provenance: null;
      statusLabel: "Not yet issued";
    }
  | {
      kind: "issued";
      amountText: string;
      provenance: Extract<DashboardMoney["provenance"], "lender_issued" | "title_issued">;
      statusLabel: "Issued";
      label: string | undefined;
    }
  | {
      kind: "estimate";
      amountText: string;
      provenance: Extract<DashboardMoney["provenance"], "ai_estimate" | "user_entered">;
      statusLabel: "ESTIMATE" | "Entered";
      label: string | undefined;
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
      amountText: null,
      provenance: null,
      statusLabel: "Not yet issued",
    };
  }

  const amountText = formatUsd(owed.amountCents);
  switch (owed.provenance) {
    case "lender_issued":
    case "title_issued":
      return {
        kind: "issued",
        amountText,
        provenance: owed.provenance,
        statusLabel: "Issued",
        label: owed.label,
      };
    case "ai_estimate":
      return {
        kind: "estimate",
        amountText,
        provenance: owed.provenance,
        statusLabel: "ESTIMATE",
        label: owed.label,
      };
    case "user_entered":
      return {
        kind: "estimate",
        amountText,
        provenance: owed.provenance,
        statusLabel: "Entered",
        label: owed.label,
      };
    default: {
      const _exhaustive: never = owed.provenance;
      return _exhaustive;
    }
  }
}
