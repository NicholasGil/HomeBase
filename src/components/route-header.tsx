import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The title block for a secondary route (offers, tours, vault, search): the
 * route name at the pack's display size, the same weight the dashboard gives
 * "where am I", so a buyer landing from a tab reads the place before anything
 * else. `caption` is the quiet line under it; the fixture pages use it for
 * the "Signed in as" note, which stays legible but no longer competes with
 * the content below.
 */
export function RouteHeader({
  title,
  caption,
  className,
}: {
  title: ReactNode;
  caption?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 space-y-1.5", className)}>
      <h1 className="text-display font-semibold tracking-tight text-balance">
        {title}
      </h1>
      {caption ? (
        <p className="text-small text-muted-foreground/80">{caption}</p>
      ) : null}
    </div>
  );
}
