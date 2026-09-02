import type { ReactNode } from "react";
import { Car, Flag } from "lucide-react";

import { cn } from "@/lib/utils";

/*
  Vertical itinerary timeline. Each stop is a two-row grid: the first row
  carries the drive-minute connector (the drive *into* this stop), the second
  row carries the numbered node and the stop card. The rail is drawn per row
  in the first column so it stays continuous through connectors and ends at
  the last node's center.
*/

const RAIL_COLUMNS = "grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 sm:gap-x-4";

function Rail({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-border",
        className,
      )}
    />
  );
}

export function TourTimeline({ children }: { children: ReactNode }) {
  return <ol className="flex flex-col">{children}</ol>;
}

export function TourTimelineOrigin({
  label,
  departAt,
}: {
  label: string;
  departAt: string;
}) {
  return (
    <li className={RAIL_COLUMNS}>
      <div className="relative flex justify-center">
        <Rail className="top-4" />
        <span className="relative z-10 flex size-8 items-center justify-center rounded-full bg-foreground text-background">
          <Flag className="size-3.5" aria-hidden />
        </span>
      </div>
      <div className="min-w-0 pt-1 pb-5">
        <p className="text-sm font-medium">Leave {label}</p>
        <p className="text-sm text-muted-foreground">{departAt}</p>
      </div>
    </li>
  );
}

export function TourTimelineStop({
  order,
  driveMinutes,
  children,
  ...rest
}: {
  order: number;
  driveMinutes: number;
  children: ReactNode;
  "data-testid": string;
  "data-property-id"?: string;
}) {
  return (
    <li {...rest} className={cn("group", RAIL_COLUMNS, "grid-rows-[auto_auto]")}>
      <div className="relative col-start-1 row-start-1">
        <Rail />
      </div>
      <p
        className="col-start-2 row-start-1 flex min-h-8 items-center gap-1.5 pb-3 text-xs font-medium text-muted-foreground"
        data-slot="drive-connector"
      >
        <Car className="size-3.5" aria-hidden />
        {driveMinutes} min drive
      </p>
      <div className="relative col-start-1 row-start-2 flex justify-center">
        <Rail className="group-last:bottom-auto group-last:h-4" />
        <span
          className="relative z-10 flex size-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
          aria-label={`Stop ${order}`}
        >
          {order}
        </span>
      </div>
      <div className="col-start-2 row-start-2 min-w-0 pb-5 group-last:pb-0">
        {children}
      </div>
    </li>
  );
}
