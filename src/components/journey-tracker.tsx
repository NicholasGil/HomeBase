import { Badge } from "@/components/ui/badge";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";

export function JourneyTracker({
  stages,
}: {
  stages: BuyerDashboardView["stages"];
}) {
  return (
    <ol
      data-testid="journey-tracker"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {stages.map((stage) => (
        <li
          key={stage.key}
          data-testid={`journey-stage-${stage.key}`}
          data-state={stage.state}
          className={
            stage.state === "current"
              ? "min-w-36 rounded-lg border-2 border-foreground bg-card px-3 py-2"
              : stage.state === "complete"
                ? "min-w-36 rounded-lg border bg-muted/40 px-3 py-2"
                : "min-w-36 rounded-lg border border-dashed px-3 py-2"
          }
        >
          <p className="font-mono text-[10px] tracking-wide text-muted-foreground">
            {String(stage.order).padStart(2, "0")}
          </p>
          <p className="text-sm font-medium">{stage.label}</p>
          <Badge
            variant={stage.state === "current" ? "default" : "outline"}
            className="mt-1"
          >
            {stage.state}
          </Badge>
        </li>
      ))}
    </ol>
  );
}
