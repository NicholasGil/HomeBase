"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { ConciergeChat } from "@/components/concierge-chat";
import { CoachDailyCheckIn } from "@/components/coach-daily-check-in";
import {
  persistCoachHabitTurn,
  readCoachHabitFromBrowser,
  writeCoachHabitToBrowser,
} from "@/lib/coach-habit-browser";
import {
  hasCoachThread,
  isCoachRepeatVisit,
  localDayKey,
  markCoachDailyCheckIn,
  recordCoachHabitVisit,
  shouldShowCoachDailyCheckIn,
  type CoachHabitTurn,
} from "@/lib/coach-habit-storage";
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
  const [hydrated, setHydrated] = useState(false);
  const [repeatVisit, setRepeatVisit] = useState(false);
  const [initialTurn, setInitialTurn] = useState<CoachHabitTurn | null>(null);
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false);
  const [habitSnapshot, setHabitSnapshot] = useState(() =>
    readCoachHabitFromBrowser(storageKey),
  );
  const visitRecordedRef = useRef(false);

  useEffect(() => {
    if (visitRecordedRef.current) {
      return;
    }
    visitRecordedRef.current = true;

    const prior = readCoachHabitFromBrowser(storageKey);
    const repeat = isCoachRepeatVisit(prior);
    const { state } = recordCoachHabitVisit(prior);
    writeCoachHabitToBrowser(storageKey, state);

    if (hasCoachThread(prior)) {
      setInitialTurn(prior.thread);
    }

    const day = localDayKey(new Date());
    if (repeat && shouldShowCoachDailyCheckIn(state, day)) {
      setShowDailyCheckIn(true);
      const marked = markCoachDailyCheckIn(state, day);
      writeCoachHabitToBrowser(storageKey, marked);
      setHabitSnapshot(marked);
    } else {
      setHabitSnapshot(state);
    }

    setRepeatVisit(repeat);
    setHydrated(true);
  }, [storageKey]);

  const returnWithThread = repeatVisit && hasCoachThread(habitSnapshot);
  const hideColdOpenEmpty =
    firstSession && returnWithThread && initialTurn !== null;

  function handleTurnComplete(turn: CoachHabitTurn) {
    const next = persistCoachHabitTurn(storageKey, habitSnapshot, turn);
    setHabitSnapshot(next);
    setInitialTurn(turn);
  }

  if (!hydrated) {
    return (
      <div
        className={cn("min-h-[12rem] animate-pulse rounded-lg bg-muted/30", className)}
        aria-hidden
      />
    );
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
