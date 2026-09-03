import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/**
 * On the dashboard the compare card is the stage's headline; the remaining
 * trades start folded behind a 44px disclosure so the page stays a short
 * scroll. Native `details` so the fixture directory needs no client state.
 */
export function VendorMoreDisclosure({
  count,
  children,
}: {
  count: number;
  children: ReactNode;
}) {
  if (count === 0) {
    return null;
  }
  return (
    <details className="group/vendors" data-testid="vendor-more">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-card px-4 text-sm font-medium ring-1 ring-black/6 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span>
          {count} more {count === 1 ? "vendor" : "vendors"} on this stage
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open/vendors:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
