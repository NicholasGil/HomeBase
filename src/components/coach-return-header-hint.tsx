"use client";

import { useEffect, useState } from "react";

import { readCoachHabitFromBrowser } from "@/lib/coach-habit-browser";
import {
  hasCoachThread,
  isCoachRepeatVisit,
} from "@/lib/coach-habit-storage";
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
  const [continueLabel, setContinueLabel] = useState<string | null>(null);

  useEffect(() => {
    const prior = readCoachHabitFromBrowser(storageKey);
    if (!isCoachRepeatVisit(prior)) {
      return;
    }
    if (hasCoachThread(prior) && prior.thread) {
      setContinueLabel(prior.thread.asked);
      return;
    }
    if (firstSession) {
      setContinueLabel("");
    }
  }, [storageKey, firstSession]);

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
