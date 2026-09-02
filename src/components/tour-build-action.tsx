import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Sticks the tour's primary action to the bottom of the viewport while the
 * candidate list is on screen. Below `md` it clears the fixed tab bar and the
 * home-indicator safe area; the wash behind it keeps the label legible over
 * the cards it floats above.
 */
export function TourBuildAction({
  children,
  hint,
  className,
}: {
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+0.75rem)] z-10 md:bottom-4",
        className,
      )}
      data-slot="tour-build-action"
    >
      <div className="-mx-2 rounded-2xl bg-background/80 p-2 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)] backdrop-blur md:mx-0 md:flex md:items-center md:gap-4 md:rounded-xl md:bg-card/90 md:px-4 md:py-3 md:shadow-[0_6px_16px_rgba(15,23,42,0.08)] md:ring-1 md:ring-black/6">
        {hint ? (
          <p className="hidden min-w-0 flex-1 text-sm text-muted-foreground md:block">
            {hint}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/** Shared sizing for the button rendered inside `TourBuildAction`. */
export const tourBuildButtonClassName =
  "h-14 w-full text-base md:h-11 md:w-auto md:px-5 md:text-sm";
