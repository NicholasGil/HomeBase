"use client";

import { Check } from "lucide-react";
import { useId, useLayoutEffect, useRef } from "react";

import { InlineScript } from "@/components/inline-script";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { cn } from "@/lib/utils";

/**
 * Scrolls the rail so the current stage sits in the middle of the visible
 * track. The inline script below is the same logic for hard navigations,
 * where it runs during HTML parsing so the rail never paints un-centered.
 */
function centerCurrentStage(rail: HTMLElement) {
  const current = rail.querySelector<HTMLElement>('[data-state="current"]');
  if (current === null) {
    return;
  }
  rail.scrollLeft =
    current.offsetLeft + current.offsetWidth / 2 - rail.clientWidth / 2;
}

function centerScriptFor(railId: string) {
  return `{var r=document.getElementById(${JSON.stringify(railId)});if(r){var c=r.querySelector('[data-state="current"]');if(c)r.scrollLeft=c.offsetLeft+c.offsetWidth/2-r.clientWidth/2}}`;
}

export function JourneyTracker({
  stages,
  className,
}: {
  stages: BuyerDashboardView["stages"];
  className?: string;
}) {
  const current = stages.find((stage) => stage.state === "current");
  const railId = useId();
  const railRef = useRef<HTMLOListElement>(null);

  useLayoutEffect(() => {
    if (railRef.current) {
      centerCurrentStage(railRef.current);
    }
  }, [current?.key]);

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <p className="font-medium uppercase tracking-[0.2em]">Journey</p>
        {current ? (
          <p className="tabular-nums">
            {current.order} of {stages.length}
          </p>
        ) : null}
      </div>
      <ol
        id={railId}
        ref={railRef}
        data-testid="journey-tracker"
        aria-label="Journey stages"
        className="relative -mx-5 mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-[max(1.25rem,calc(50%-4rem))] py-1 [mask-image:linear-gradient(to_right,transparent,black_1.25rem,black_calc(100%-1.25rem),transparent)] [scrollbar-width:none] lg:mx-0 lg:px-[calc(50%-4rem)] [&::-webkit-scrollbar]:hidden"
      >
        {stages.map((stage) => (
          <li
            key={stage.key}
            data-testid={`journey-stage-${stage.key}`}
            data-state={stage.state}
            title={`${stage.label} · ${stage.state}`}
            className={cn(
              "flex min-h-11 shrink-0 snap-center items-center gap-2 rounded-full px-3.5 text-sm font-medium whitespace-nowrap",
              stage.state === "current" &&
                "bg-next text-next-foreground shadow-[0_2px_8px_rgba(15,23,42,0.12)]",
              stage.state === "complete" && "bg-sand text-sand-foreground",
              stage.state === "upcoming" &&
                "bg-card text-muted-foreground ring-1 ring-black/8",
            )}
          >
            {stage.state === "complete" ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <span
                className={cn(
                  "text-xs tabular-nums",
                  stage.state === "current"
                    ? "text-next-foreground/80"
                    : "text-muted-foreground/70",
                )}
              >
                {String(stage.order).padStart(2, "0")}
              </span>
            )}
            <span>{stage.label}</span>
            <span className="sr-only">{stage.state}</span>
          </li>
        ))}
      </ol>
      <InlineScript html={centerScriptFor(railId)} />
    </div>
  );
}
