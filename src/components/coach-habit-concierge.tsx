"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { ConciergeChat } from "@/components/concierge-chat";
import { CoachDailyCheckIn } from "@/components/coach-daily-check-in";
import {
  getCoachHabitSessionServerSnapshot,
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
  wrapMobileQuestionStarters,
  mobileStickyDockAboveTabBar,
  fileSummaryAboveThread,
  onThreadActiveChange,
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
  wrapMobileQuestionStarters?: boolean;
  mobileStickyDockAboveTabBar?: boolean;
  fileSummaryAboveThread?: ReactNode | null;
  onThreadActiveChange?: (active: boolean) => void;
  scrollIntro?: ReactNode;
  idleHint?: string;
  questionPlaceholder?: string;
}) {
  const session = useSyncExternalStore(
    subscribeCoachHabitSession,
    () => getCoachHabitSessionSnapshot(storageKey),
    getCoachHabitSessionServerSnapshot,
  );

  const { repeatVisit, habitSnapshot, initialTurn, showDailyCheckIn } = session;
  const returnWithThread = repeatVisit && hasCoachThread(habitSnapshot);
  const hideColdOpenEmpty =
    firstSession && returnWithThread && initialTurn !== null;
  const [threadActive, setThreadActive] = useState(initialTurn !== null);

  function handleTurnComplete(turn: CoachHabitTurn) {
    persistCoachHabitSessionTurn(storageKey, turn);
  }

  const handleThreadActiveChange = useCallback(
    (active: boolean) => {
      setThreadActive(active);
      onThreadActiveChange?.(active);
    },
    [onThreadActiveChange],
  );

  useEffect(() => {
    if (initialTurn !== null) {
      handleThreadActiveChange(true);
    }
  }, [initialTurn, handleThreadActiveChange]);

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        firstSession
          ? "min-h-0 flex-1"
          : "max-md:flex-none max-md:shrink-0 md:min-h-0 md:flex-1",
        className,
      )}
    >
      <ConciergeChat
        key={initialTurn?.asked ?? "idle"}
        className="min-h-0 flex-1 px-0 pb-0 pt-0"
        availability={availability}
        showAgentLinkWhenUnavailable={showAgentLinkWhenUnavailable}
        starters={starters}
        pinStartersAboveScrollOnMobile={pinStartersAboveScrollOnMobile}
        wrapMobileQuestionStarters={wrapMobileQuestionStarters}
        mobileStickyDockAboveTabBar={mobileStickyDockAboveTabBar}
        fileSummaryAboveThread={fileSummaryAboveThread}
        threadHeader={
          showDailyCheckIn && !threadActive
            ? (
                <CoachDailyCheckIn
                  stageLabel={stageLabel}
                  firstName={firstName}
                  className="shrink-0"
                />
              )
            : null
        }
        onThreadActiveChange={handleThreadActiveChange}
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
