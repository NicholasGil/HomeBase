import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { cn } from "@/lib/utils";

export function JourneyTracker({
  stages,
}: {
  stages: BuyerDashboardView["stages"];
}) {
  const current = stages.find((stage) => stage.state === "current");

  return (
    <div className="min-w-0 sm:max-w-xs sm:text-right">
      {current ? (
        <p className="text-sm text-muted-foreground">
          {current.label} · {current.order} of {stages.length}
        </p>
      ) : null}
      <ol
        data-testid="journey-tracker"
        className="mt-2 flex items-center gap-1"
      >
        {stages.map((stage) => (
          <li
            key={stage.key}
            data-testid={`journey-stage-${stage.key}`}
            data-state={stage.state}
            title={`${stage.label} · ${stage.state}`}
            className={cn(
              "h-1.5 min-w-0 flex-1 rounded-full",
              stage.state === "current" && "bg-next",
              stage.state === "complete" && "bg-foreground/55",
              stage.state === "upcoming" && "bg-foreground/12",
            )}
          >
            <span className="sr-only">
              {String(stage.order).padStart(2, "0")} {stage.label} {stage.state}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
