"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { TransactionSkeleton } from "@/components/route-skeletons";
import { StageAdvancePanel } from "@/components/stage-advance-panel";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

export function LiveStageAdvancePanel({ view }: { view: BuyerDashboardView }) {
  const advance = useMutation(api.transactions.advanceStage);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <StageAdvancePanel
      view={view}
      busy={busy}
      error={error}
      onAdvance={() => {
        setBusy(true);
        setError(null);
        void advance({
          transactionId: view.transactionId as Id<"transactions">,
        })
          .catch((cause: unknown) => {
            setError(cause instanceof Error ? cause.message : "STAGE_BLOCKED");
          })
          .finally(() => {
            setBusy(false);
          });
      }}
    />
  );
}

export function LiveTransactionPage({
  transactionId,
}: {
  transactionId: string;
}) {
  const view = useQuery(api.dashboard.getById, {
    transactionId: transactionId as Id<"transactions">,
  });

  if (view === undefined) {
    return <TransactionSkeleton />;
  }

  return (
    <div className="space-y-10">
      <BuyerDashboardViewPanel
        view={view}
        eyebrow="Opened by id"
        journeyOrientation="responsive"
      />
      <LiveStageAdvancePanel view={view} />
    </div>
  );
}
