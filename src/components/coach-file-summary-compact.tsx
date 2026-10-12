import Link from "next/link";

import { transactionHref } from "@/components/buyer-dashboard-view";
import { MoneyFigureView } from "@/components/money-figure-view";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { cn } from "@/lib/utils";

/** Mobile file-session thread: keep stage, due today, and next visible above answers. */
export function CoachFileSummaryCompact({
  view,
  className,
}: {
  view: BuyerDashboardView;
  className?: string;
}) {
  const nextLabel = view.next?.title ?? "No open task";
  const owed = view.owedToday;

  return (
    <div
      data-testid="coach-file-summary-compact"
      className={cn(
        "rounded-xl border border-border/70 bg-muted/25 px-4 py-3 text-small",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p className="font-medium text-foreground">{view.where.label}</p>
        <Link
          href={transactionHref(view.transactionId)}
          className="text-eyebrow font-medium text-muted-foreground underline-offset-2 hover:underline"
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
