"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { ConciergeChat } from "@/components/concierge-chat";
import { CoachDailyCheckIn } from "@/components/coach-daily-check-in";
import {
  getCoachHabitSessionSnapshot,
  persistCoachHabitSessionTurn,
  subscribeCoachHabitSession,
} from "@/lib/coach-habit-client-session";
import { hasCoachThread } from "@/lib/coach-habit-storage";
import type { CoachHabitTurn } from "@/lib/coach-habit-storage";
import type { ConciergeAvailability } from "@/lib/concierge-availability";
import { cn } from "@/lib/utils";

export function CoachHabitConcierge({
  storageKey,
  firstSession,
  stageLabel,
  firstName,
  className,
  availability,
  showAgentLinkWhenUnavailable,
  starters,
  pinStartersAboveScrollOnMobile,
  scrollIntro,
  idleHint,
  questionPlaceholder,
}: {
  storageKey: string;
  firstSession: boolean;
  stageLabel: string;
  firstName: string;
  className?: string;
  availability?: ConciergeAvailability;
  showAgentLinkWhenUnavailable?: boolean;
  starters?: readonly string[];
  pinStartersAboveScrollOnMobile?: boolean;
  scrollIntro?: ReactNode;
  idleHint?: string;
  questionPlaceholder?: string;
}) {
  const session = useSyncExternalStore(
    subscribeCoachHabitSession,
    () => getCoachHabitSessionSnapshot(storageKey),
    () => null,
  );

  if (session === null) {
    return (
      <div
        className={cn("min-h-[12rem] animate-pulse rounded-lg bg-muted/30", className)}
        aria-hidden
      />
    );
  }

  const { repeatVisit, habitSnapshot, initialTurn, showDailyCheckIn } = session;
  const returnWithThread = repeatVisit && hasCoachThread(habitSnapshot);
  const hideColdOpenEmpty =
    firstSession && returnWithThread && initialTurn !== null;

  function handleTurnComplete(turn: CoachHabitTurn) {
    persistCoachHabitSessionTurn(storageKey, turn);
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      {showDailyCheckIn ? (
        <CoachDailyCheckIn
          stageLabel={stageLabel}
          firstName={firstName}
          className="shrink-0"
        />
      ) : null}
      <ConciergeChat
        className="min-h-0 flex-1 px-0 pb-0 pt-0"
        availability={availability}
        showAgentLinkWhenUnavailable={showAgentLinkWhenUnavailable}
        starters={starters}
        pinStartersAboveScrollOnMobile={pinStartersAboveScrollOnMobile}
        pinRestoredThreadOnMobile={
          !firstSession && repeatVisit && initialTurn !== null
        }
        scrollIntro={hideColdOpenEmpty ? undefined : scrollIntro}
        idleHint={
          returnWithThread && firstSession
            ? "Your last answer is below — tap a starter or keep asking."
            : idleHint
        }
        questionPlaceholder={questionPlaceholder}
        initialTurn={initialTurn}
        onTurnComplete={handleTurnComplete}
      />
    </div>
  );
}
