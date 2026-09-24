import Link from "next/link";
import type { ReactNode } from "react";

import { DoneList } from "@/components/done-list";
import {
  JourneyTracker,
  type JourneyOrientation,
} from "@/components/journey-tracker";
import { MoneyFigureView } from "@/components/money-figure-view";
import { Badge } from "@/components/ui/badge";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { cn } from "@/lib/utils";

/*
  lg placement of the five hero nodes. `horizontal` (dashboard): two columns,
  rail beside the Next card. `responsive` (transaction page): the rail turns
  vertical and takes a 15rem column for all four rows, the rest stack left.
*/
export const HERO_GRID_CLASS: Record<
  JourneyOrientation,
  {
    grid: string;
    where: string;
    rail: string;
    next: string;
    owe: string;
    doneWaiting: string;
  }
> = {
  horizontal: {
    grid: "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr]",
    where: "lg:col-start-1 lg:row-start-1",
    rail: "lg:col-start-2 lg:row-start-2 lg:self-start",
    next: "lg:col-start-1 lg:row-start-2",
    owe: "lg:col-start-2 lg:row-start-1",
    doneWaiting: "lg:col-start-1 lg:row-start-3",
  },
  responsive: {
    grid: "lg:grid-cols-[minmax(0,1fr)_15rem] lg:grid-rows-[auto_auto_auto_1fr]",
    where: "lg:col-start-1 lg:row-start-1",
    rail: "lg:col-start-2 lg:row-start-1 lg:row-span-4 lg:self-start",
    next: "lg:col-start-1 lg:row-start-2",
    owe: "lg:col-start-1 lg:row-start-3",
    doneWaiting: "lg:col-start-1 lg:row-start-4",
  },
};

export function OwedTodayFigure({
  owed,
  size = "display",
}: {
  owed: BuyerDashboardView["owedToday"];
  size?: "sm" | "md" | "display";
}) {
  return (
    <MoneyFigureView figure={owed} size={size} showLabel={false} buyerFacing />
  );
}

function DrillLink({
  href,
  className,
  children,
}: {
  href: string | undefined;
  className: string;
  children: ReactNode;
}) {
  if (href === undefined) {
    return <div className={className}>{children}</div>;
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export type TenSecondHeroVariant = "page" | "coach";

export function TenSecondHeroGrid({
  view,
  buyerName,
  journeyOrientation = "horizontal",
  detailHref,
  variant = "page",
}: {
  view: BuyerDashboardView;
  buyerName?: string;
  journeyOrientation?: JourneyOrientation;
  detailHref?: string;
  variant?: TenSecondHeroVariant;
}) {
  const owed = view.owedToday;
  const place = view.propertyAddress
    ? `${view.propertyAddress.city}, ${view.propertyAddress.state}`
    : null;
  const at = HERO_GRID_CLASS[journeyOrientation];
  const drill = detailHref;
  const compact = variant === "coach";
  const addressLine = view.propertyAddress?.line1;

  return (
    <div
      data-testid="ten-second-hero"
      className={cn(
        "grid gap-2.5 lg:gap-x-8 lg:gap-y-6",
        compact ? "px-0 pt-0 pb-1 lg:px-0" : "px-5 pt-2.5 pb-5 lg:px-6 lg:py-6",
        at.grid,
      )}
    >
      <div
        className={cn(
          "min-w-0 space-y-1 lg:flex lg:flex-col lg:justify-end",
          at.where,
        )}
      >
        <p className="text-sm text-muted-foreground">
          {buyerName ?? "Your transaction"}
          {place ? ` · ${place}` : null}
        </p>
        {compact && addressLine ? (
          <p className="truncate text-small font-medium text-foreground">
            {addressLine}
          </p>
        ) : null}
        <h2
          data-testid="ten-second-where"
          className={cn(
            "font-semibold tracking-tight text-balance",
            compact
              ? "text-h2"
              : "text-display lg:text-5xl",
          )}
        >
          {view.where.label}
        </h2>
        {variant === "page" ? (
          <p className="text-xs text-muted-foreground lg:text-sm">
            Status {view.where.status}.
          </p>
        ) : null}
      </div>

      <JourneyTracker
        stages={view.stages}
        href={drill}
        orientation={journeyOrientation}
        className={cn(at.rail, compact && "max-md:hidden")}
      />

      <section
        data-testid="ten-second-next"
        className={cn(
          "rounded-xl bg-sand px-4 py-3 lg:px-5 lg:py-6",
          compact && "max-md:px-3 max-md:py-2",
          at.next,
        )}
      >
        {view.next === null ? (
          <>
            <p className="text-eyebrow font-medium uppercase tracking-[0.2em] text-next">
              Next
            </p>
            <p className="mt-2 text-sm text-muted-foreground lg:mt-3">
              No open task right now.
            </p>
          </>
        ) : (
          <DrillLink href={drill} className="block">
            <span className="flex items-center justify-between gap-3">
              <span className="text-eyebrow font-medium uppercase tracking-[0.2em] text-next">
                Next
              </span>
              <Badge variant="sage">{view.next.assigneeRole}</Badge>
            </span>
            <span
              className={cn(
                "mt-1.5 block font-semibold tracking-tight text-balance lg:mt-3",
                compact ? "text-h3" : "text-h2 lg:text-h1",
              )}
            >
              {view.next.title}
            </span>
          </DrillLink>
        )}
      </section>

      <section
        data-testid="ten-second-owe"
        className={cn(
          "rounded-xl bg-sky px-4 py-3 lg:px-5 lg:py-6",
          compact && "max-md:hidden",
          at.owe,
        )}
      >
        <DrillLink
          href={drill}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 lg:block"
        >
          <p className="text-eyebrow font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Due today
          </p>
          <p className="min-w-0 text-small text-muted-foreground lg:mt-1 lg:text-body">
            {owed?.label ?? "No sourced figure on this file"}
          </p>
        </DrillLink>
        <div className={cn(compact ? "mt-1.5 lg:mt-2" : "mt-2 lg:mt-4")}>
          <OwedTodayFigure owed={owed} size={compact ? "md" : "display"} />
        </div>
      </section>

      <div
        className={cn(
          "grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-3 lg:grid-cols-2 lg:gap-6",
          compact && "max-md:gap-2",
          at.doneWaiting,
        )}
      >
        <section data-testid="ten-second-done" className="min-w-0">
          <p className="text-eyebrow font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Done
          </p>
          <DoneList items={view.done} />
        </section>

        <section data-testid="ten-second-waiting" className="min-w-0">
          <p className="text-eyebrow font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Waiting on
          </p>
          <p className={cn("mt-2 font-medium", compact ? "text-body" : "text-h3")}>
            {view.waitingOn ?? "Nobody"}
          </p>
        </section>
      </div>
    </div>
  );
}
