"use client";

import { useQuery } from "convex/react";

import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
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
    <BuyerDashboardViewPanel
      view={view}
      eyebrow="Opened by id"
    />
  );
}
