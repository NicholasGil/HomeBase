import { ConciergeChat } from "@/components/concierge-chat";
import {
  BuyerLockedUpsellRail,
} from "@/components/buyer-locked-upsell";
import type { ConciergeScope } from "@/components/concierge-sheet";
import { BUYER_LOCKED_UPSELLS } from "@/lib/buyer-shell";
import { cn } from "@/lib/utils";

export function CoachHome({
  scope,
  buyerName,
  eyebrow,
}: {
  scope: ConciergeScope;
  buyerName: string;
  eyebrow?: string;
}) {
  return (
    <div
      data-testid="coach-home"
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,18rem)] lg:items-start"
    >
      <section
        aria-label="Personal coach"
        className={cn(
          "flex min-h-0 flex-col overflow-x-hidden rounded-3xl border border-border/80 bg-card shadow-sm max-md:overflow-y-hidden",
          "max-md:max-h-[calc(100dvh-var(--coach-mobile-chrome)-var(--coach-compose-clearance))]",
          "md:min-h-[min(70vh,640px)]",
        )}
      >
        <header
          data-testid="concierge-scope"
          className="shrink-0 border-b border-border/70 px-5 pt-5 pb-4"
        >
          <p className="text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Personal coach
          </p>
          {eyebrow ? (
            <p className="mt-1 text-xs text-muted-foreground">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight">
            {scope.address}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span className="inline-flex h-6 items-center rounded-full bg-sage px-2.5 text-xs font-medium text-sage-foreground">
              {scope.stage}
            </span>
            <span>
              Hi {buyerName.split(" ")[0]} — I explain this file only. I never
              advise.
            </span>
          </p>
        </header>
        <ConciergeChat className="min-h-0 flex-1 px-5 pt-4 pb-5" />
      </section>

      <BuyerLockedUpsellRail upsells={BUYER_LOCKED_UPSELLS} />
    </div>
  );
}
