"use client";

import { useQuery } from "convex/react";

import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { LiveContractExplainer } from "@/components/live-contract-explainer";
import { LiveOfferCenter } from "@/components/live-offer-center";
import { LiveTourBuilder } from "@/components/live-tour-builder";
import { LiveHomeownershipHub } from "@/components/live-homeownership-hub";
import { LiveVendorDirectory } from "@/components/live-vendor-directory";
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
      {view.where.status === "closed" ? (
        <LiveHomeownershipHub transactionId={view.transactionId} />
      ) : null}
      <LiveVendorDirectory transactionId={view.transactionId} />
      <LiveTourBuilder />
      <LiveOfferCenter />
      <LiveContractExplainer />
    </div>
  );
}
