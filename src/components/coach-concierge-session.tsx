"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { ConciergeChat } from "@/components/concierge-chat";
import { CoachDailyCheckIn } from "@/components/coach-daily-check-in";
import type { ConciergeScope } from "@/components/concierge-sheet";
import { isCoachDiscoveryEmptyScope } from "@/lib/coach-first-session";
import { coachDailyFocusOptions } from "@/lib/coach-return-copy";
import {
  coachScopeKeyFromParts,
  coachScopeStorageKey,
  coachPageLoadId,
  markDailyCheckInComplete,
  readCoachVisit,
  readCoachThread,
  shouldShowDailyCheckIn,
  touchCoachVisit,
  type CoachConciergeTurn,
  writeCoachThread,
} from "@/lib/coach-session-storage";
import type { ConciergeAvailability } from "@/lib/concierge-availability";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";

export function CoachConciergeSession({
  identity,
  scope,
  dashboardView = null,
  availability = "ready",
  firstSessionStarters,
  firstSessionScrollIntro,
  firstSessionIdleHint,
  firstSessionQuestionPlaceholder,
  pinStartersAboveScrollOnMobile,
  showAgentLinkWhenUnavailable,
  className,
}: {
  identity: string;
  scope: ConciergeScope;
  dashboardView?: BuyerDashboardView | null;
  availability?: ConciergeAvailability;
  firstSessionStarters?: readonly string[];
  firstSessionScrollIntro?: ReactNode;
  firstSessionIdleHint?: string;
  firstSessionQuestionPlaceholder?: string;
  pinStartersAboveScrollOnMobile?: boolean;
  showAgentLinkWhenUnavailable?: boolean;
  className?: string;
}) {
  const discoveryEmpty = isCoachDiscoveryEmptyScope(scope);
  const firstSession = discoveryEmpty;
  const storageKey = useMemo(
    () =>
      coachScopeStorageKey({
        identity,
        scopeKey: coachScopeKeyFromParts({
          discoveryEmpty,
          transactionId: dashboardView?.transactionId ?? null,
        }),
      }),
    [identity, discoveryEmpty, dashboardView?.transactionId],
  );

  const [boot, setBoot] = useState<{
    thread: CoachConciergeTurn[];
    isReturnVisit: boolean;
    showDailyCheckIn: boolean;
  } | null>(null);
  const [queuedQuestion, setQueuedQuestion] = useState<string | null>(null);

  useEffect(() => {
    const storage = window.localStorage;
    const session = window.sessionStorage;
    const pageId = coachPageLoadId();
    const touchGuard = `${storageKey}:boot:${pageId}`;
    const cachedBoot = session.getItem(touchGuard);
    if (cachedBoot !== null) {
      try {
        const parsed = JSON.parse(cachedBoot) as {
          thread: CoachConciergeTurn[];
          isReturnVisit: boolean;
          showDailyCheckIn: boolean;
        };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- strict-mode remount
        setBoot(parsed);
        return;
      } catch {
        session.removeItem(touchGuard);
      }
    }

    const priorVisit = readCoachVisit(storageKey, storage);
    const isReturnVisit = priorVisit !== null;
    const visit = touchCoachVisit(storageKey, storage);
    const nextBoot = {
      thread: readCoachThread(storageKey, storage),
      isReturnVisit,
      showDailyCheckIn:
        isReturnVisit && shouldShowDailyCheckIn(visit.record),
    };
    session.setItem(touchGuard, JSON.stringify(nextBoot));
    // Hydrate return-visit + thread from localStorage once per page load.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage bootstrap
    setBoot(nextBoot);
  }, [storageKey]);

  function persistThread(turns: CoachConciergeTurn[]) {
    writeCoachThread(storageKey, window.localStorage, turns);
  }

  function completeDailyCheckIn() {
    markDailyCheckInComplete(storageKey, window.localStorage);
    setBoot((current) =>
      current === null
        ? current
        : { ...current, showDailyCheckIn: false },
    );
  }

  if (boot === null) {
    return (
      <div
        className="min-h-0 flex-1"
        aria-hidden
        data-testid="coach-concierge-session"
        data-coach-session-boot="pending"
      />
    );
  }

  const treatAsReturn = boot.isReturnVisit;
  const useFirstSessionChrome = firstSession && !treatAsReturn;
  const showDailyCheckIn = boot.showDailyCheckIn;

  const dailyOptions = coachDailyFocusOptions(dashboardView);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-3"
      data-testid="coach-concierge-session"
      data-coach-session-boot="ready"
    >
      {treatAsReturn ? (
        <p
          data-testid="coach-return-visit"
          className="shrink-0 rounded-lg border border-sage/40 bg-sage/15 px-3 py-2 text-small text-foreground"
        >
          Welcome back — your coach kept context on this file. Scroll to resume
          your thread or ask what matters today.
        </p>
      ) : null}
      {treatAsReturn && showDailyCheckIn ? (
        <CoachDailyCheckIn
          options={dailyOptions}
          onPick={(label) => {
            completeDailyCheckIn();
            setQueuedQuestion(label);
          }}
          onDismiss={completeDailyCheckIn}
        />
      ) : null}
      <ConciergeChat
        key={storageKey}
        className={className}
        availability={availability}
        showAgentLinkWhenUnavailable={showAgentLinkWhenUnavailable}
        starters={useFirstSessionChrome ? firstSessionStarters : undefined}
        pinStartersAboveScrollOnMobile={
          useFirstSessionChrome ? pinStartersAboveScrollOnMobile : false
        }
        scrollIntro={useFirstSessionChrome ? firstSessionScrollIntro : undefined}
        idleHint={
          useFirstSessionChrome
            ? firstSessionIdleHint
            : treatAsReturn
              ? "Your prior questions are below — ask a follow-up anytime."
              : undefined
        }
        questionPlaceholder={
          useFirstSessionChrome ? firstSessionQuestionPlaceholder : undefined
        }
        initialThread={boot.thread}
        onThreadChange={persistThread}
        queuedQuestion={queuedQuestion}
        onQueuedQuestionConsumed={() => setQueuedQuestion(null)}
      />
    </div>
  );
}
