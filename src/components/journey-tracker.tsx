"use client";

import { Check } from "lucide-react";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { InlineScript } from "@/components/inline-script";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { cn } from "@/lib/utils";

/**
 * `horizontal`: a snap-scrolling dot rail at every width (the dashboard hero).
 * `responsive`: the same rail below `lg`, a vertical rail with every label
 * from `lg` up (the transaction page, where the hero gives it a column).
 */
export type JourneyOrientation = "horizontal" | "responsive";

type Stage = BuyerDashboardView["stages"][number];

const STATE_TEXT: Record<Stage["state"], string> = {
  complete: "complete",
  current: "current stage",
  upcoming: "upcoming",
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function railOverflows(rail: HTMLElement) {
  return rail.scrollWidth > rail.clientWidth;
}

/**
 * Scrolls the rail so `stage` sits in the middle of the visible track. The
 * inline script below is the same arithmetic for hard navigations, where it
 * runs during HTML parsing so the rail never paints un-centered. Nothing here
 * animates unless motion is allowed.
 */
function centerStage(rail: HTMLElement, stage: HTMLElement, animate: boolean) {
  const behavior: ScrollBehavior =
    animate && !prefersReducedMotion() ? "smooth" : "auto";
  if (!railOverflows(rail)) {
    stage.scrollIntoView({ block: "nearest", inline: "nearest", behavior });
    return;
  }
  rail.scrollTo({
    left: stage.offsetLeft + stage.offsetWidth / 2 - rail.clientWidth / 2,
    behavior,
  });
}

function centerScriptFor(railId: string) {
  return `{var r=document.getElementById(${JSON.stringify(railId)});if(r&&r.scrollWidth>r.clientWidth){var c=r.querySelector('[data-state="current"]');if(c)r.scrollLeft=c.offsetLeft+c.offsetWidth/2-r.clientWidth/2}}`;
}

const RAIL_CLASS = {
  horizontal:
    "relative -mx-5 mt-2 flex snap-x snap-mandatory items-start overflow-x-auto pt-1 pb-2 outline-none [mask-image:linear-gradient(to_right,transparent,black_1.25rem,black_calc(100%-1.25rem),transparent)] [scrollbar-width:none] before:w-1/2 before:shrink-0 after:w-1/2 after:shrink-0 lg:mx-0 [&::-webkit-scrollbar]:hidden",
  responsive:
    "lg:flex-col lg:items-stretch lg:overflow-visible lg:snap-none lg:pt-0 lg:pb-0 lg:[mask-image:none] lg:before:hidden lg:after:hidden",
} as const;

const STAGE_CLASS = {
  horizontal:
    "group relative flex min-h-11 shrink-0 snap-center flex-col items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
  responsive:
    "lg:w-auto lg:min-w-0 lg:flex-row lg:items-center lg:gap-3 lg:px-2 lg:snap-align-none",
} as const;

const DOT_CELL_CLASS = {
  horizontal: "relative flex h-8 w-full items-center justify-center",
  responsive: "lg:h-auto lg:w-8 lg:shrink-0 lg:self-stretch",
} as const;

/* Connector halves: the segment from the previous dot and the one to the next. */
const LINE_BEFORE_CLASS = {
  horizontal: "absolute top-1/2 right-1/2 left-0 h-px -translate-y-1/2",
  responsive:
    "lg:top-0 lg:right-auto lg:bottom-1/2 lg:left-1/2 lg:h-auto lg:w-px lg:-translate-x-1/2 lg:translate-y-0",
} as const;

const LINE_AFTER_CLASS = {
  horizontal: "absolute top-1/2 right-0 left-1/2 h-px -translate-y-1/2",
  responsive:
    "lg:top-1/2 lg:right-auto lg:bottom-0 lg:left-1/2 lg:h-auto lg:w-px lg:-translate-x-1/2 lg:translate-y-0",
} as const;

const LABEL_CLASS = {
  horizontal: "mt-1.5 text-xs font-medium whitespace-nowrap",
  responsive: "lg:not-sr-only lg:mt-0 lg:text-sm lg:font-medium",
} as const;

const LINE_DONE = "bg-sand-foreground/35";
const LINE_TODO = "bg-border";

function StageDot({ stage }: { stage: Stage }) {
  if (stage.state === "complete") {
    return (
      <span
        aria-hidden
        className="relative z-10 flex size-6 items-center justify-center rounded-full bg-sand text-sand-foreground"
      >
        <Check className="size-3.5" />
      </span>
    );
  }
  if (stage.state === "current") {
    return (
      <span
        aria-hidden
        className="relative z-10 flex size-8 items-center justify-center rounded-full bg-next text-xs font-semibold text-next-foreground tabular-nums shadow-[0_2px_8px_rgba(15,23,42,0.16)] ring-4 ring-next/15"
      >
        {String(stage.order).padStart(2, "0")}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="relative z-10 flex size-6 items-center justify-center rounded-full bg-card text-[10px] font-medium text-muted-foreground tabular-nums ring-1 ring-black/10"
    >
      {String(stage.order).padStart(2, "0")}
    </span>
  );
}

export function JourneyTracker({
  stages,
  className,
  orientation = "horizontal",
}: {
  stages: BuyerDashboardView["stages"];
  className?: string;
  orientation?: JourneyOrientation;
}) {
  const currentIndex = stages.findIndex((stage) => stage.state === "current");
  const current = currentIndex === -1 ? undefined : stages[currentIndex];
  const railId = useId();
  const railRef = useRef<HTMLOListElement>(null);
  const responsive = orientation === "responsive";

  // Roving tabindex: one stage is tabbable, arrows move it. It follows the
  // current stage whenever the stage itself changes (a live advance).
  const homeKey = current?.key ?? stages[0]?.key;
  const [activeKey, setActiveKey] = useState(homeKey);
  const [seenHomeKey, setSeenHomeKey] = useState(homeKey);
  if (seenHomeKey !== homeKey) {
    setSeenHomeKey(homeKey);
    setActiveKey(homeKey);
  }

  useLayoutEffect(() => {
    const rail = railRef.current;
    const stage = rail?.querySelector<HTMLElement>('[data-state="current"]');
    if (rail && stage && railOverflows(rail)) {
      centerStage(rail, stage, false);
    }
  }, [current?.key]);

  function moveFocus(event: KeyboardEvent<HTMLOListElement>) {
    const rail = railRef.current;
    if (rail === null) {
      return;
    }
    const items = Array.from(rail.querySelectorAll<HTMLElement>("li"));
    const index = items.findIndex((item) => item === document.activeElement);
    if (index === -1) {
      return;
    }
    let target: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        target = Math.min(index + 1, items.length - 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        target = Math.max(index - 1, 0);
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const item = items[target];
    if (item === undefined) {
      return;
    }
    item.focus({ preventScroll: true });
    centerStage(rail, item, true);
  }

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
        data-orientation={orientation}
        aria-label="Journey stages"
        onKeyDown={moveFocus}
        className={cn(
          RAIL_CLASS.horizontal,
          responsive && RAIL_CLASS.responsive,
        )}
      >
        {stages.map((stage, index) => {
          const isCurrent = stage.state === "current";
          const near =
            (currentIndex !== -1 && Math.abs(index - currentIndex) <= 1) ||
            stage.key === activeKey;
          const doneBefore = stage.state !== "upcoming";
          const doneAfter = stage.state === "complete";
          return (
            <li
              key={stage.key}
              data-testid={`journey-stage-${stage.key}`}
              data-state={stage.state}
              aria-current={isCurrent ? "step" : undefined}
              tabIndex={stage.key === activeKey ? 0 : -1}
              onFocus={() => setActiveKey(stage.key)}
              onClick={(event) => {
                if (railRef.current) {
                  centerStage(railRef.current, event.currentTarget, true);
                }
              }}
              title={`${stage.label} · ${STATE_TEXT[stage.state]}`}
              className={cn(
                STAGE_CLASS.horizontal,
                near ? "min-w-11 px-1.5" : "w-11",
                responsive && STAGE_CLASS.responsive,
                responsive && isCurrent && "lg:rounded-xl lg:bg-sand/50",
              )}
            >
              <span
                className={cn(
                  DOT_CELL_CLASS.horizontal,
                  responsive && DOT_CELL_CLASS.responsive,
                )}
              >
                {index > 0 ? (
                  <span
                    aria-hidden
                    className={cn(
                      LINE_BEFORE_CLASS.horizontal,
                      responsive && LINE_BEFORE_CLASS.responsive,
                      doneBefore ? LINE_DONE : LINE_TODO,
                    )}
                  />
                ) : null}
                {index < stages.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn(
                      LINE_AFTER_CLASS.horizontal,
                      responsive && LINE_AFTER_CLASS.responsive,
                      doneAfter ? LINE_DONE : LINE_TODO,
                    )}
                  />
                ) : null}
                <StageDot stage={stage} />
              </span>
              <span
                className={cn(
                  near ? LABEL_CLASS.horizontal : "sr-only",
                  responsive && LABEL_CLASS.responsive,
                  isCurrent && "text-foreground lg:font-semibold",
                  stage.state === "complete" && "text-sand-foreground",
                  stage.state === "upcoming" && "text-muted-foreground",
                )}
              >
                {stage.label}
              </span>
              <span className="sr-only">
                {` · stage ${stage.order} of ${stages.length}, ${STATE_TEXT[stage.state]}`}
              </span>
            </li>
          );
        })}
      </ol>
      <InlineScript html={centerScriptFor(railId)} />
    </div>
  );
}
