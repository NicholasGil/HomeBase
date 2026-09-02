"use client";

import { ChevronDown, Map as MapIcon } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Below `md` the map starts collapsed behind a 44px disclosure so the
 * itinerary is the first thing under the departure notice. From `md` up the
 * disclosure is hidden and the map is always shown; `open` state only
 * matters on small screens.
 */
export function TourMapDisclosure({
  stopCount,
  children,
}: {
  stopCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const stopsLabel = `${stopCount} ${stopCount === 1 ? "stop" : "stops"}`;

  return (
    <div data-slot="tour-map-disclosure">
      <button
        type="button"
        data-testid="tour-map-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-card px-4 text-left text-sm font-medium ring-1 ring-black/6 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:hidden"
      >
        <span className="inline-flex items-center gap-2">
          <MapIcon className="size-4 text-muted-foreground" aria-hidden />
          {open ? "Hide map" : "Show map"}
          <span className="font-normal text-muted-foreground">
            · {stopsLabel}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open ? "rotate-180" : "",
          )}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        className={open ? "mt-3 md:mt-0" : "hidden md:block"}
      >
        {children}
      </div>
    </div>
  );
}
