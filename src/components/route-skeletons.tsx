import type { ReactNode } from "react";

import { HERO_GRID_CLASS } from "@/components/buyer-dashboard-view";
import type { JourneyOrientation } from "@/components/journey-tracker";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { tripStackClassName } from "@/lib/trip-ui";
import { cn } from "@/lib/utils";

/**
 * Static twin of `AppShell` for `loading.tsx`. It reads no cookies so the
 * frame is in the first HTML flush: same header height (44px targets + py-2),
 * same `max-w-5xl px-5 py-10` main, same tab-bar spacer below `md`. It carries
 * none of the shell's test ids, so specs only ever match the real shell.
 */
export function ShellSkeleton({
  children,
  label = "Loading",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className="min-h-full bg-background" aria-busy="true">
      <header className="sticky top-0 z-20 border-b border-sand/80 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-2">
          <p className="inline-flex min-h-11 shrink-0 items-center text-body font-semibold tracking-tight">
            HomeBase
          </p>
          <Skeleton className="hidden h-9 w-64 rounded-full sm:block" />
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-3 px-3 md:flex">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="size-11 rounded-full" />
          </div>
        </div>
      </header>
      <main
        role="status"
        aria-label={label}
        className="mx-auto max-w-5xl px-5 py-10"
      >
        <span className="sr-only">{label}…</span>
        {children}
      </main>
      <div
        aria-hidden
        className="h-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] md:hidden"
      />
    </div>
  );
}

/** `h1.text-h1.mb-6` plus the "Signed in as" line with its `mb-8`. */
export function PageTitleSkeleton({ width = "w-40" }: { width?: string }) {
  return (
    <>
      <Skeleton className={cn("mb-6 h-9", width)} />
      <Skeleton className="mb-8 h-5 w-56" />
    </>
  );
}

/** Section heading (`text-lg`) with its one-line description and a badge. */
export function SectionHeadingSkeleton({
  badges = 1,
  description = "w-3/5",
}: {
  badges?: number;
  description?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-6 w-44" />
        <Skeleton className={cn("h-4 max-w-full", description)} />
      </div>
      {badges > 0 ? (
        <div className="flex gap-2">
          {Array.from({ length: badges }, (_, index) => (
            <Skeleton key={index} className="h-5 w-20 rounded-full" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Same frame as `ListingCardFrame`: 20/19 photo tile over an address block. */
export function ListingCardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <Card className="py-0 hover:translate-y-0 hover:shadow-none">
      <Skeleton className="aspect-[20/19] w-full rounded-none bg-sand" />
      <div className="space-y-2 px-4 pt-3 pb-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
    </Card>
  );
}

export function ListingGridSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** A `Card` with a header (title + description) and `lines` body lines. */
export function InfoCardSkeleton({
  lines = 1,
  button = false,
  className,
}: {
  lines?: number;
  button?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("hover:translate-y-0 hover:shadow-none", className)}>
      <div className="space-y-1.5 px-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="space-y-3 px-4">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
        {button ? <Skeleton className="h-8 w-36 rounded-lg" /> : null}
      </div>
    </Card>
  );
}

/** The dot rail: a centered current dot flanked by two labelled neighbours. */
function JourneyRailSkeleton({ vertical }: { vertical: boolean }) {
  return (
    <>
      <div
        className={cn(
          "mt-2 flex items-start justify-center gap-0 py-1",
          vertical && "lg:hidden",
        )}
      >
        {Array.from({ length: 7 }, (_, index) => {
          const near = Math.abs(index - 3) <= 1;
          return (
            <div
              key={index}
              className={cn(
                "flex min-h-11 flex-col items-center",
                near ? "w-20" : "w-11",
              )}
            >
              <Skeleton
                className={cn(
                  "rounded-full",
                  index === 3 ? "size-8 bg-next/20" : "size-6",
                )}
              />
              {near ? <Skeleton className="mt-1.5 h-3 w-14" /> : null}
            </div>
          );
        })}
      </div>
      {vertical ? (
        <div className="mt-2 hidden lg:block">
          {Array.from({ length: 13 }, (_, index) => (
            <div
              key={index}
              className="flex min-h-11 items-center gap-3 px-2"
            >
              <Skeleton
                className={cn(
                  "shrink-0 rounded-full",
                  index === 7 ? "size-8 bg-next/20" : "size-6",
                )}
              />
              <Skeleton
                className={cn("h-4", index % 3 === 0 ? "w-28" : "w-20")}
              />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

/**
 * The ten-second hero. Node order and grid placement copy
 * `BuyerDashboardViewPanel` (see `HERO_GRID_CLASS`) so the skeleton and the
 * loaded card occupy the same rows at 375 and the same columns at lg.
 */
export function TenSecondHeroSkeleton({
  journeyOrientation = "horizontal",
}: {
  journeyOrientation?: JourneyOrientation;
}) {
  const at = HERO_GRID_CLASS[journeyOrientation];
  return (
    <section className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/6">
      <Skeleton className="h-32 w-full rounded-none bg-sand lg:h-40" />
      <div
        className={cn(
          "grid gap-3 px-5 pt-3 pb-5 lg:gap-x-8 lg:gap-y-6 lg:px-6 lg:py-6",
          at.grid,
        )}
      >
        <div
          className={cn(
            "min-w-0 space-y-2 lg:flex lg:flex-col lg:justify-end",
            at.where,
          )}
        >
          <Skeleton className="h-5 w-36 rounded-full lg:mb-auto" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-10 w-56 lg:h-12" />
          <Skeleton className="h-4 w-60" />
        </div>

        <div className={cn("min-w-0", at.rail)}>
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-10" />
          </div>
          <JourneyRailSkeleton vertical={journeyOrientation === "responsive"} />
        </div>

        <div
          className={cn(
            "rounded-xl bg-sand px-4 py-3.5 lg:px-5 lg:py-6",
            at.next,
          )}
        >
          <Skeleton className="h-4 w-12 bg-sand-foreground/15" />
          <Skeleton className="mt-2 h-8 w-4/5 bg-sand-foreground/15 lg:mt-3 lg:h-9" />
          <Skeleton className="mt-2 h-5 w-16 rounded-full bg-sand-foreground/15 lg:mt-3" />
        </div>

        <div
          className={cn(
            "rounded-xl bg-sky px-4 py-3.5 lg:px-5 lg:py-6",
            at.owe,
          )}
        >
          <Skeleton className="h-4 w-20 bg-sky-foreground/15" />
          <Skeleton className="mt-1 h-4 w-40 bg-sky-foreground/15" />
          <Skeleton className="mt-3 h-11 w-40 bg-sky-foreground/15 lg:mt-4" />
          <Skeleton className="mt-2 h-5 w-32 rounded-full bg-sky-foreground/15" />
        </div>

        <div className={cn("grid grid-cols-2 gap-4 lg:gap-6", at.doneWaiting)}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** The three columns under the hero: this stage, deadlines, contacts. */
export function StageColumnsSkeleton() {
  return (
    <section className="grid gap-8 md:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-full" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>
        </div>
      ))}
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div className={tripStackClassName}>
      <div className="space-y-10">
        <TenSecondHeroSkeleton />
        <StageColumnsSkeleton />
      </div>
      <section className="space-y-6">
        <SectionHeadingSkeleton />
        <ListingGridSkeleton />
      </section>
      <section className="space-y-6">
        <SectionHeadingSkeleton />
        <InfoCardSkeleton lines={3} />
      </section>
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-10">
        <TenSecondHeroSkeleton journeyOrientation="responsive" />
        <StageColumnsSkeleton />
      </div>
      <InfoCardSkeleton lines={1} button />
    </div>
  );
}

export function VaultSectionSkeleton() {
  return (
    <section className="space-y-4">
      <SectionHeadingSkeleton badges={0} description="w-96" />
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCardSkeleton lines={1} button />
        <InfoCardSkeleton lines={1} button />
      </div>
      <InfoCardSkeleton lines={1} />
    </section>
  );
}

export function VaultSkeleton() {
  return (
    <>
      <PageTitleSkeleton width="w-56" />
      <VaultSectionSkeleton />
    </>
  );
}

export function DocumentSkeleton() {
  return (
    <Card className="hover:translate-y-0 hover:shadow-none">
      <div className="space-y-2 px-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2 px-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-56" />
      </div>
    </Card>
  );
}

export function ToursSectionSkeleton() {
  return (
    <section className="space-y-6">
      <SectionHeadingSkeleton description="w-4/5" />
      <ListingGridSkeleton />
      <Skeleton className="h-8 w-32 rounded-lg bg-next/25" />
      <Skeleton className="h-4 w-40" />
    </section>
  );
}

export function ToursSkeleton() {
  return (
    <>
      <PageTitleSkeleton width="w-24" />
      <ToursSectionSkeleton />
    </>
  );
}

export function OffersSectionSkeleton() {
  return (
    <section className="space-y-8">
      <SectionHeadingSkeleton description="w-4/5" />
      <Card className="hover:translate-y-0 hover:shadow-none">
        <div className="space-y-1.5 px-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 px-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-36" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCardSkeleton lines={3} />
        <InfoCardSkeleton lines={3} />
        <InfoCardSkeleton lines={3} />
      </div>
    </section>
  );
}

export function OffersSkeleton() {
  return (
    <>
      <PageTitleSkeleton width="w-24" />
      <OffersSectionSkeleton />
    </>
  );
}

export function SearchSectionSkeleton() {
  return (
    <section className="space-y-8">
      <SectionHeadingSkeleton badges={2} description="w-4/5" />
      <div className="space-y-3">
        <Skeleton className="h-14 w-full rounded-full bg-card ring-1 ring-black/5" />
        <div className="flex items-center justify-between gap-2 px-1">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="hidden h-4 w-72 sm:block" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-7 w-12 rounded-lg" />
        <Skeleton className="h-7 w-16 rounded-lg" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <ListingCardSkeleton lines={2} />
        <ListingCardSkeleton lines={2} />
      </div>
    </section>
  );
}

export function SearchSkeleton() {
  return (
    <>
      <PageTitleSkeleton width="w-28" />
      <SearchSectionSkeleton />
    </>
  );
}
