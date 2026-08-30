"use client";

import { useQuery } from "convex/react";

import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { StageAdvancePanel } from "@/components/stage-advance-panel";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

export function LiveTransactionPage({
  transactionId,
}: {
  transactionId: string;
}) {
  const view = useQuery(api.dashboard.getById, {
    transactionId: transactionId as Id<"transactions">,
  });

  if (view === undefined) {
    return <p className="text-sm text-muted-foreground">Loading transaction…</p>;
  }

  return (
    <div className="space-y-6">
      <BuyerDashboardViewPanel
        view={view}
        eyebrow="Opened by id"
      />
      <StageAdvancePanel view={view} />
    </div>
  );
}
