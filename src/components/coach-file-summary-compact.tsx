import Link from "next/link";

import { transactionHref } from "@/components/buyer-dashboard-view";
import { MoneyFigureView } from "@/components/money-figure-view";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { journeyStepProgress } from "../../convex/lib/journeyLogic";
import { coachFileNextDisplayLabel } from "@/lib/demo-file-session-view";
import { cn } from "@/lib/utils";

/** Mobile file-session thread: keep stage, due today, and next visible above answers. */
export function CoachFileSummaryCompact({
  view,
  className,
}: {
  view: BuyerDashboardView;
  className?: string;
}) {
  const nextLabel =
    view.next === null ? "No open task" : coachFileNextDisplayLabel(view);
  const owed = view.owedToday;
  const { step, total } = journeyStepProgress(view.stages);

  return (
    <div
      data-testid="coach-file-summary-compact"
      className={cn(
        "rounded-xl border border-border/70 bg-muted/25 px-4 py-3 text-small",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{view.where.label}</p>
          <p
            className="text-eyebrow text-muted-foreground"
            data-testid="coach-journey-step"
          >
            Step {step} of {total}
          </p>
        </div>
        <Link
          href={transactionHref(view.transactionId)}
          className="inline-flex min-h-11 items-center px-2 text-eyebrow font-medium text-muted-foreground underline-offset-2 hover:underline"
        >
          View file
        </Link>
      </div>
      <dl className="mt-2 grid gap-1.5 text-muted-foreground">
        <div className="flex flex-wrap justify-between gap-x-2">
          <dt>Due today</dt>
          <dd className="text-foreground">
            <MoneyFigureView figure={owed} size="sm" showLabel={false} buyerFacing />
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-2">
          <dt>Next</dt>
          <dd className="text-right text-foreground">{nextLabel}</dd>
        </div>
      </dl>
    </div>
  );
}
