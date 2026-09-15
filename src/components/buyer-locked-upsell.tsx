import Link from "next/link";

import {
  LockChromeEyebrow,
  LockChromeIcon,
} from "@/components/lock-chrome";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BUYER_LOCKED_OS_PAYMENT_DISCLAIMER,
  type BuyerLockedUpsell,
} from "@/lib/buyer-shell";
import { cn } from "@/lib/utils";

const lockedUpsellCardClassName =
  "border-dashed border-border/70 bg-muted/25 shadow-none ring-0 hover:translate-none hover:shadow-none";

export function BuyerLockedUpsellCard({
  upsell,
  compact,
  bulletsOnly,
  showPaymentDisclaimer = false,
  className,
}: {
  upsell: BuyerLockedUpsell;
  compact?: boolean;
  /** Pricing page: title + bullets only (no per-card disclaimer). */
  bulletsOnly?: boolean;
  showPaymentDisclaimer?: boolean;
  className?: string;
}) {
  return (
    <Card
      data-testid={`locked-upsell-${upsell.area}`}
      data-locked-upsell="true"
      className={cn(
        lockedUpsellCardClassName,
        compact ? "gap-2 py-0" : "",
        className,
      )}
    >
      <CardHeader
        className={cn(
          compact ? "gap-1.5 px-4 pt-3 pb-0" : bulletsOnly ? "gap-1.5 pb-0" : undefined,
        )}
      >
        <div className="flex items-start gap-2">
          {!bulletsOnly ? (
            <LockChromeIcon className={cn(compact ? "size-6" : "size-8")} />
          ) : null}
          <div className="min-w-0 space-y-0.5">
            {!bulletsOnly ? <LockChromeEyebrow /> : null}
            <CardTitle
              className={cn(
                "font-normal text-muted-foreground",
                compact || bulletsOnly ? "text-small" : "text-h3",
              )}
            >
              {upsell.title}
            </CardTitle>
            {!bulletsOnly ? (
              <CardDescription
                className={cn(
                  "text-pretty",
                  compact ? "text-small" : "text-body",
                )}
              >
                {upsell.description}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          compact ? "px-4 pb-3" : undefined,
          bulletsOnly && "pt-2",
        )}
      >
        <ul
          className={cn(
            "list-disc space-y-0.5 pl-5 text-muted-foreground",
            compact || bulletsOnly ? "text-small" : "text-body",
          )}
        >
          {upsell.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {showPaymentDisclaimer ? (
          <p className="mt-3 text-small text-muted-foreground">
            {BUYER_LOCKED_OS_PAYMENT_DISCLAIMER}
          </p>
        ) : null}
        {compact ? (
          <Link
            href={upsell.href}
            className="mt-2 inline-flex min-h-11 items-center text-small font-medium text-foreground underline-offset-4 hover:underline"
          >
            Learn more
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BuyerLockedOsMobileSummary({
  upsells,
}: {
  upsells: readonly BuyerLockedUpsell[];
}) {
  const labels = upsells.map((row) => row.label).join(", ");
  return (
    <div
      data-testid="locked-upsell-rail-summary"
      className="flex gap-2.5 rounded-2xl border border-dashed border-border/60 bg-muted/15 px-4 py-3 md:hidden"
    >
      <LockChromeIcon className="mt-0.5 size-6 opacity-80" iconClassName="size-3" />
      <div className="min-w-0 space-y-1">
        <p className="text-small font-medium text-muted-foreground">
          Full OS locked
        </p>
        <p className="text-small text-pretty text-muted-foreground/90">
          {labels} stay off until your agent enables the full transaction OS.
        </p>
        <Link
          href="/pricing"
          className="inline-flex min-h-11 items-center text-small font-medium text-foreground underline-offset-4 hover:underline"
        >
          See what&apos;s included
        </Link>
      </div>
    </div>
  );
}

export function BuyerLockedUpsellRail({
  upsells,
  className,
}: {
  upsells: readonly BuyerLockedUpsell[];
  className?: string;
}) {
  return (
    <aside
      aria-label="Full OS preview"
      data-testid="locked-upsell-rail"
      className={cn(
        "space-y-2 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+0.5rem)] md:space-y-3 md:pb-0",
        className,
      )}
    >
      <BuyerLockedOsMobileSummary upsells={upsells} />
      <p className="hidden text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase md:block">
        Full transaction OS
      </p>
      <div className="hidden space-y-3 md:block">
        {upsells.map((upsell) => (
          <BuyerLockedUpsellCard key={upsell.area} upsell={upsell} compact />
        ))}
      </div>
    </aside>
  );
}

export function BuyerLockedRouteGate({
  upsell,
}: {
  upsell: BuyerLockedUpsell;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <BuyerLockedUpsellCard upsell={upsell} showPaymentDisclaimer />
      <Link
        href="/coach"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-body font-medium text-primary-foreground"
      >
        Back to your coach
      </Link>
    </div>
  );
}
