import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  BUYER_LOCKED_OS_PAYMENT_DISCLAIMER,
  BUYER_LOCKED_UPSELLS,
} from "@/lib/buyer-shell";
import { cn } from "@/lib/utils";

/** Single investor-friendly teaser instead of four locked cards in public demo. */
export function BuyerFullOsTeaser({ className }: { className?: string }) {
  const labels = BUYER_LOCKED_UPSELLS.map((row) => row.label).join(", ");
  return (
    <aside
      aria-label="Full OS preview"
      data-testid="demo-full-os-teaser"
      className={cn(
        "rounded-2xl border border-border/80 bg-card px-4 py-4 shadow-sm md:px-5 md:py-5",
        "pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+0.5rem)] md:pb-5",
        className,
      )}
    >
      <p className="text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase">
        Full transaction OS
      </p>
      <p className="mt-2 text-pretty text-body font-medium text-foreground">
        Search, tours, pipeline, and vault
      </p>
      <p className="mt-1 text-pretty text-small text-muted-foreground">
        Sample data in this demo — {labels} are open to explore. Live billing and
        agent enablement are not on in the demo.
      </p>
      <p className="mt-2 text-small text-muted-foreground">
        {BUYER_LOCKED_OS_PAYMENT_DISCLAIMER}
      </p>
      <Link
        href="/pricing"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "mt-4 inline-flex min-h-11 w-full rounded-full",
        )}
      >
        See pricing
      </Link>
    </aside>
  );
}
