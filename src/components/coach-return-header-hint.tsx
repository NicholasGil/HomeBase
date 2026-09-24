"use client";

import { useSyncExternalStore } from "react";

import {
  coachReturnContinueLabel,
  subscribeCoachHabitSession,
} from "@/lib/coach-habit-client-session";
import { cn } from "@/lib/utils";

export function CoachReturnHeaderHint({
  storageKey,
  firstSession,
  className,
}: {
  storageKey: string;
  firstSession: boolean;
  className?: string;
}) {
  const continueLabel = useSyncExternalStore(
    subscribeCoachHabitSession,
    () => coachReturnContinueLabel(storageKey, firstSession),
    () => null,
  );

  if (continueLabel === null) {
    return null;
  }

  if (continueLabel.length === 0) {
    return (
      <p
        data-testid="coach-return-continue"
        className={cn("mt-1 text-small font-medium text-foreground", className)}
      >
        Welcome back — pick up where you left off below.
      </p>
    );
  }

  return (
    <p
      data-testid="coach-return-continue"
      className={cn("mt-1 text-small font-medium text-foreground", className)}
    >
      Continue where you left off
      <span className="font-normal text-muted-foreground">
        {" "}
        — &ldquo;{continueLabel}&rdquo;
      </span>
    </p>
  );
}
