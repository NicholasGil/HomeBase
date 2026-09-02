"use client";

import { useQuery } from "convex/react";
import { Search } from "lucide-react";

import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { EmptyState } from "@/components/empty-state";
import { LiveContractExplainer } from "@/components/live-contract-explainer";
import { LiveOfferCenter } from "@/components/live-offer-center";
import { LiveTourBuilder } from "@/components/live-tour-builder";
import { LiveHomeownershipHub } from "@/components/live-homeownership-hub";
import { LiveVendorDirectory } from "@/components/live-vendor-directory";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { DashboardSkeleton } from "@/components/route-skeletons";
import { tripStackClassName } from "@/lib/trip-ui";
import { api } from "../../convex/_generated/api";

export function LiveBuyerDashboard({ buyerName }: { buyerName?: string }) {
  const view = useQuery(api.dashboard.getBuyerDashboard, {});

  if (view === undefined) {
    return <DashboardSkeleton />;
  }

  if (view === null) {
    return (
      <EmptyState
        icon={Search}
        title="No transaction is attached to this buyer yet."
        description="Your file starts when your agent opens a transaction. Until then you can browse sample homes."
        action={{ href: "/search", label: "Search homes" }}
      />
    );
  }

  return (
    <div className={tripStackClassName}>
      <BuyerDashboardViewPanel view={view} buyerName={buyerName} />
      {view.where.status === "closed" ? (
        <QueryErrorBoundary message="The homeownership hub did not load.">
          <LiveHomeownershipHub transactionId={view.transactionId} />
        </QueryErrorBoundary>
      ) : null}
      <QueryErrorBoundary message="The vendor directory did not load.">
        <LiveVendorDirectory transactionId={view.transactionId} />
      </QueryErrorBoundary>
      <QueryErrorBoundary message="Tours did not load.">
        <LiveTourBuilder />
      </QueryErrorBoundary>
      <QueryErrorBoundary message="The offer center did not load.">
        <LiveOfferCenter />
      </QueryErrorBoundary>
      <QueryErrorBoundary message="The contract explainer did not load.">
        <LiveContractExplainer />
      </QueryErrorBoundary>
    </div>
  );
}
