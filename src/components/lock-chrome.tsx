import { LockKeyhole } from "lucide-react";

import { cn } from "@/lib/utils";

/** Shared lock affordance for buyer upsell cards and mobile tab badges. */
export function LockChromeIcon({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-sand text-sand-foreground ring-1 ring-border/70",
        className,
      )}
      aria-hidden
    >
      <LockKeyhole className={cn("size-3.5", iconClassName)} />
    </span>
  );
}

export function LockChromeEyebrow({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase",
        className,
      )}
    >
      Locked · full OS
    </p>
  );
}

/** Sits on the tab icon pill so the lock is not clipped by the tab bar edge. */
export function TabLockChromeBadge({ className }: { className?: string }) {
  return (
    <LockChromeIcon
      className={cn("absolute -right-1 -bottom-1 size-4 ring-2 ring-card", className)}
      iconClassName="size-2.5"
    />
  );
}
