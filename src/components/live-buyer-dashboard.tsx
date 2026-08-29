"use client";

import { useQuery } from "convex/react";

import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { api } from "../../convex/_generated/api";

export function LiveBuyerDashboard({ buyerName }: { buyerName?: string }) {
  const view = useQuery(api.dashboard.getBuyerDashboard, {});

  if (view === undefined) {
    return <p className="text-sm text-muted-foreground">Loading your file…</p>;
  }

  if (view === null) {
    return (
      <p className="text-sm text-muted-foreground">
        No transaction is attached to this buyer yet.
      </p>
    );
  }

  return <BuyerDashboardViewPanel view={view} buyerName={buyerName} />;
}
