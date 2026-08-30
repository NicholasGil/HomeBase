"use client";

import { useQuery } from "convex/react";

import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { LiveOfferCenter } from "@/components/live-offer-center";
import { LiveTourBuilder } from "@/components/live-tour-builder";
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

  return (
    <div className="space-y-10">
      <BuyerDashboardViewPanel view={view} buyerName={buyerName} />
      <LiveTourBuilder />
      <LiveOfferCenter />
    </div>
  );
}
