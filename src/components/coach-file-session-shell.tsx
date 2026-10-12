"use client";

import { useCallback, useState, type ReactNode } from "react";

import { CoachFileSummaryCompact } from "@/components/coach-file-summary-compact";
import { CoachHabitConcierge } from "@/components/coach-habit-concierge";
import { CoachTenSecondReturnGate } from "@/components/coach-ten-second-return-gate";
import type { ConciergeAvailability } from "@/lib/concierge-availability";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { cn } from "@/lib/utils";

export function CoachFileSessionShell({
  storageKey,
  firstSession,
  dashboardView,
  tenSecondChildren,
  tenSecondClassName,
  stageLabel,
  firstName,
  habitClassName,
  availability,
  showAgentLinkWhenUnavailable,
  starters,
  allStarters,
  pinStartersAboveScrollOnMobile,
  wrapMobileQuestionStarters,
  scrollIntro,
  idleHint,
  questionPlaceholder,
}: {
  storageKey: string;
  firstSession: boolean;
  dashboardView: BuyerDashboardView;
  tenSecondChildren: ReactNode;
  tenSecondClassName: string;
  stageLabel: string;
  firstName: string;
  habitClassName: string;
  availability?: ConciergeAvailability;
  showAgentLinkWhenUnavailable?: boolean;
  starters?: readonly string[];
  allStarters?: readonly string[];
  pinStartersAboveScrollOnMobile?: boolean;
  wrapMobileQuestionStarters?: boolean;
  scrollIntro?: ReactNode;
  idleHint?: string;
  questionPlaceholder?: string;
}) {
  const [threadActive, setThreadActive] = useState(false);
  const onThreadActiveChange = useCallback((active: boolean) => {
    setThreadActive(active);
  }, []);

  const hideFullHeroOnMobile = !firstSession && threadActive;
  const fileSummaryCompact =
    hideFullHeroOnMobile ? (
      <CoachFileSummaryCompact view={dashboardView} />
    ) : null;

  return (
    <>
      <CoachTenSecondReturnGate
        storageKey={storageKey}
        firstSession={firstSession}
        className={cn(
          tenSecondClassName,
          hideFullHeroOnMobile && "max-md:hidden",
        )}
      >
        {tenSecondChildren}
      </CoachTenSecondReturnGate>
      <CoachHabitConcierge
        storageKey={storageKey}
        firstSession={firstSession}
        stageLabel={stageLabel}
        firstName={firstName}
        className={habitClassName}
        availability={availability}
        showAgentLinkWhenUnavailable={showAgentLinkWhenUnavailable}
        starters={starters}
        allStarters={allStarters}
        pinStartersAboveScrollOnMobile={pinStartersAboveScrollOnMobile}
        wrapMobileQuestionStarters={wrapMobileQuestionStarters}
        mobileStickyDockAboveTabBar={!firstSession}
        fileSummaryAboveThread={fileSummaryCompact}
        onThreadActiveChange={onThreadActiveChange}
        scrollIntro={scrollIntro}
        idleHint={idleHint}
        questionPlaceholder={questionPlaceholder}
      />
    </>
  );
}
