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

/** Quiet lock mark on mobile tabs — coach chips/Ask stay primary. */
export function TabLockChromeBadge({ className }: { className?: string }) {
  return (
    <LockKeyhole
      className={cn(
        "absolute -right-0.5 -bottom-0.5 size-2.5 text-muted-foreground/65",
        className,
      )}
      aria-hidden
    />
  );
}
