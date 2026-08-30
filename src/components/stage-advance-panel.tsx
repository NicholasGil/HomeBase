"use client";

import { useMutation } from "convex/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

export function StageAdvancePanel({
  view,
}: {
  view: BuyerDashboardView;
}) {
  const advance = useMutation(api.transactions.advanceStage);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advance stage</CardTitle>
        <CardDescription>
          Licensee action. Blocked while a blocking task on this stage is open.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          {view.canAdvance
            ? `Next: ${view.nextStage?.label ?? "none"}`
            : view.blockingTasks[0]
              ? `Blocked by ${view.blockingTasks[0].title}`
              : "No next stage"}
        </p>
        <Button
          disabled={busy || !view.canAdvance}
          onClick={() => {
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
        >
          Advance stage
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
