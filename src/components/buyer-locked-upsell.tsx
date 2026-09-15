import { LockKeyhole } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BuyerLockedUpsell } from "@/lib/buyer-shell";
import { cn } from "@/lib/utils";

export function BuyerLockedUpsellCard({
  upsell,
  compact,
  className,
}: {
  upsell: BuyerLockedUpsell;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Card
      data-testid={`locked-upsell-${upsell.area}`}
      className={cn(
        "border-dashed bg-muted/40 shadow-none",
        compact ? "gap-3 py-0" : "",
        className,
      )}
    >
      <CardHeader className={compact ? "gap-2 px-4 pt-4 pb-0" : undefined}>
        <div className="flex items-start gap-2">
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-sand text-sand-foreground"
            aria-hidden
          >
            <LockKeyhole className="size-4" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Locked · full OS
            </p>
            <CardTitle className={compact ? "text-base" : undefined}>
              {upsell.title}
            </CardTitle>
            <CardDescription className="text-pretty">
              {upsell.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "px-4 pb-4" : undefined}>
        <ul className="list-disc space-y-1 pl-5 text-body text-muted-foreground">
          {upsell.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-4 text-small text-muted-foreground">
          No payment is taken here. Your agent or brokerage enables these areas
          when you are ready for the full transaction OS.
        </p>
        {compact ? (
          <Link
            href={upsell.href}
            className="mt-3 inline-flex min-h-11 items-center text-body font-medium text-foreground underline-offset-4 hover:underline"
          >
            Learn more
          </Link>
        ) : null}
      </CardContent>
    </Card>
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
        "space-y-3 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+0.5rem)] md:pb-0",
        className,
      )}
    >
      <p className="text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase">
        Full transaction OS
      </p>
      {upsells.map((upsell) => (
        <BuyerLockedUpsellCard key={upsell.area} upsell={upsell} compact />
      ))}
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
      <BuyerLockedUpsellCard upsell={upsell} />
      <Link
        href="/coach"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-body font-medium text-primary-foreground"
      >
        Back to your coach
      </Link>
    </div>
  );
}
