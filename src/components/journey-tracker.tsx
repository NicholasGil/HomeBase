"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
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

/* How many stages one end-cap press moves the rail: about half a 375 screen. */
const CAP_STEP = 3;

/* A stage within this many px of the middle counts as centred. */
const EDGE_SLACK = 2;

type Overflow = { start: boolean; end: boolean };

/*
  Measured against the first and last stage rather than the scroll extent:
  the half-width spacers let the track scroll a little past either end stage,
  and that empty run is not "more stages".
*/
function overflowOf(rail: HTMLElement): Overflow {
  const items = rail.querySelectorAll<HTMLElement>("li");
  const first = items[0];
  const last = items[items.length - 1];
  if (!railOverflows(rail) || first === undefined || last === undefined) {
    return { start: false, end: false };
  }
  const middle = rail.scrollLeft + rail.clientWidth / 2;
  return {
    start: first.offsetLeft + first.offsetWidth / 2 < middle - EDGE_SLACK,
    end: last.offsetLeft + last.offsetWidth / 2 > middle + EDGE_SLACK,
  };
}

/* The item whose centre sits nearest the middle of the visible track. */
function centeredIndex(rail: HTMLElement, items: HTMLElement[]) {
  const middle = rail.scrollLeft + rail.clientWidth / 2;
  let nearest = 0;
  let distance = Number.POSITIVE_INFINITY;
  items.forEach((item, index) => {
    const gap = Math.abs(item.offsetLeft + item.offsetWidth / 2 - middle);
    if (gap < distance) {
      distance = gap;
      nearest = index;
    }
  });
  return nearest;
}

/*
  The frame bleeds to the viewport edge below `lg` so the track can run
  edge to edge; the caps sit on that frame, over the faded ends of the track.
*/
const FRAME_CLASS = {
  horizontal: "relative -mx-5 mt-2 lg:mx-0",
  responsive: "",
} as const;

/*
  The track is fully clear for its first 0.5rem and fades in over the next
  2.5rem: wider than a far node (2.75rem), so anything cut by the frame edge
  is visibly dissolving rather than sliced through, and the cap discs sit on
  ghosted track.
*/
const RAIL_CLASS = {
  horizontal:
    "flex snap-x snap-mandatory items-start overflow-x-auto pt-1 pb-2 outline-none [mask-image:linear-gradient(to_right,transparent_0.5rem,black_3rem,black_calc(100%-3rem),transparent_calc(100%-0.5rem))] [scrollbar-width:none] before:w-1/2 before:shrink-0 after:w-1/2 after:shrink-0 [&::-webkit-scrollbar]:hidden",
  responsive:
    "lg:flex-col lg:items-stretch lg:overflow-visible lg:snap-none lg:pt-0 lg:pb-0 lg:[mask-image:none] lg:before:hidden lg:after:hidden",
} as const;

/*
  End caps: a 44px hit area centred on the dot row (pt-1 + h-8 cell puts the
  dot centre 20px down) around a small disc. A cap is disabled, and fades out,
  once the rail has nothing more in its direction; the vertical lg rail has
  none. Buttons carry no tabindex so the rail keeps its single roving stop.
*/
const CAP_CLASS = {
  horizontal:
    "absolute -top-0.5 z-10 flex size-11 items-center justify-center rounded-full outline-none transition-opacity duration-200 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-0",
  responsive: "lg:hidden",
} as const;

/* Lifted well clear of the track so a node passing under it reads as behind. */
const CAP_DISC_CLASS =
  "flex size-7 items-center justify-center rounded-full bg-card text-foreground shadow-[0_2px_8px_rgba(15,23,42,0.18)] ring-1 ring-black/10 transition-colors group-hover/cap:bg-sand";

/* The snap item; the chip inside it is the focusable (and, when linked, navigable) surface. */
const ITEM_CLASS = {
  horizontal: "shrink-0 snap-center",
  responsive: "lg:snap-align-none",
} as const;

const STAGE_CLASS = {
  horizontal:
    "group flex min-h-11 flex-col items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
  responsive:
    "lg:w-auto lg:min-w-0 lg:flex-row lg:items-center lg:gap-3 lg:px-2",
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
    // "You are here" is an ink ring, deliberately not the coral CTA fill.
    return (
      <span
        aria-hidden
        className="relative z-10 flex size-8 items-center justify-center rounded-full bg-card text-xs font-semibold text-foreground tabular-nums shadow-[0_2px_8px_rgba(15,23,42,0.16)] ring-2 ring-foreground"
      >
        {String(stage.order).padStart(2, "0")}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="relative z-10 flex size-6 items-center justify-center rounded-full bg-card text-eyebrow font-medium text-muted-foreground tabular-nums ring-1 ring-black/10"
    >
      {String(stage.order).padStart(2, "0")}
    </span>
  );
}

export function JourneyTracker({
  stages,
  href,
  className,
  orientation = "horizontal",
}: {
  stages: BuyerDashboardView["stages"];
  /**
   * Where a stage chip drills in (the transaction detail route). Omit on that
   * route itself: the chips then stay focusable but are not links.
   */
  href?: string;
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

  // The caps start out assuming the rail overflows both ways (true for a
  // mid-flight file on every phone) and settle on the real answer once the
  // rail has laid out; scroll and resize keep them honest afterwards.
  const [overflow, setOverflow] = useState<Overflow>({
    start: stages.length > 1,
    end: stages.length > 1,
  });

  useEffect(() => {
    const rail = railRef.current;
    if (rail === null) {
      return;
    }
    const update = () => setOverflow(overflowOf(rail));
    update();
    rail.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    return () => {
      rail.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function step(direction: -1 | 1) {
    const rail = railRef.current;
    if (rail === null) {
      return;
    }
    const items = Array.from(rail.querySelectorAll<HTMLElement>("li"));
    const target = Math.min(
      Math.max(centeredIndex(rail, items) + direction * CAP_STEP, 0),
      items.length - 1,
    );
    const item = items[target];
    if (item !== undefined) {
      centerStage(rail, item, true);
    }
  }

  function moveFocus(event: KeyboardEvent<HTMLOListElement>) {
    const rail = railRef.current;
    if (rail === null) {
      return;
    }
    const items = Array.from(rail.querySelectorAll<HTMLElement>("li"));
    const index = items.findIndex((item) =>
      item.contains(document.activeElement),
    );
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
    const chip = item.querySelector<HTMLElement>("[data-slot='journey-chip']");
    (chip ?? item).focus({ preventScroll: true });
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
      <div
        className={cn(
          FRAME_CLASS.horizontal,
          responsive && FRAME_CLASS.responsive,
        )}
      >
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
            const chipProps = {
              "data-slot": "journey-chip",
              tabIndex: stage.key === activeKey ? 0 : -1,
              title: `${stage.label} · ${STATE_TEXT[stage.state]}`,
              className: cn(
                STAGE_CLASS.horizontal,
                near ? "min-w-11 px-1.5" : "w-11",
                responsive && STAGE_CLASS.responsive,
                responsive && isCurrent && "lg:rounded-xl lg:bg-sand/50",
              ),
            };
            const chip = (
              <>
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
              </>
            );
            return (
              <li
                key={stage.key}
                data-testid={`journey-stage-${stage.key}`}
                data-state={stage.state}
                aria-current={isCurrent ? "step" : undefined}
                onFocus={() => setActiveKey(stage.key)}
                onClick={(event) => {
                  if (railRef.current) {
                    centerStage(railRef.current, event.currentTarget, true);
                  }
                }}
                className={cn(
                  ITEM_CLASS.horizontal,
                  responsive && ITEM_CLASS.responsive,
                )}
              >
                {href === undefined ? (
                  <span {...chipProps}>{chip}</span>
                ) : (
                  <Link href={href} {...chipProps}>
                    {chip}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          aria-label="Earlier stages"
          disabled={!overflow.start}
          onClick={() => step(-1)}
          className={cn(
            "group/cap left-0.5",
            CAP_CLASS.horizontal,
            responsive && CAP_CLASS.responsive,
          )}
        >
          <span className={CAP_DISC_CLASS}>
            <ChevronLeft className="size-4" aria-hidden />
          </span>
        </button>
        <button
          type="button"
          aria-label="Later stages"
          disabled={!overflow.end}
          onClick={() => step(1)}
          className={cn(
            "group/cap right-0.5",
            CAP_CLASS.horizontal,
            responsive && CAP_CLASS.responsive,
          )}
        >
          <span className={CAP_DISC_CLASS}>
            <ChevronRight className="size-4" aria-hidden />
          </span>
        </button>
      </div>
      <InlineScript html={centerScriptFor(railId)} />
    </div>
  );
}
