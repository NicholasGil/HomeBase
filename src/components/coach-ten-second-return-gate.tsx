"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import {
  getCoachHabitSessionServerSnapshot,
  getCoachHabitSessionSnapshot,
  subscribeCoachHabitSession,
} from "@/lib/coach-habit-client-session";
import { cn } from "@/lib/utils";

/**
 * On file-session return with a saved thread, prioritize the restored Ask band
 * inside the fixed-height mobile coach card (#62 ten-second stays on desktop).
 */
export function CoachTenSecondReturnGate({
  storageKey,
  firstSession,
  className,
  children,
}: {
  storageKey: string;
  firstSession: boolean;
  className?: string;
  children: ReactNode;
}) {
  const session = useSyncExternalStore(
    subscribeCoachHabitSession,
    () => getCoachHabitSessionSnapshot(storageKey),
    getCoachHabitSessionServerSnapshot,
  );

  const compactMobileReturn =
    !firstSession &&
    session.repeatVisit &&
    session.initialTurn !== null;

  return (
    <div
      data-testid="coach-ten-second"
      className={cn(className, compactMobileReturn && "max-md:hidden")}
    >
      {children}
    </div>
  );
}
