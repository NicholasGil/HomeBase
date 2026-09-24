import Link from "next/link";

import { CoachHabitConcierge } from "@/components/coach-habit-concierge";
import { CoachReturnHeaderHint } from "@/components/coach-return-header-hint";
import { CoachTenSecondReturnGate } from "@/components/coach-ten-second-return-gate";
import { ConciergeChat } from "@/components/concierge-chat";
import {
  BuyerLockedUpsellRail,
} from "@/components/buyer-locked-upsell";
import type { ConciergeScope } from "@/components/concierge-sheet";
import { TenSecondHeroGrid } from "@/components/ten-second-hero";
import { transactionHref } from "@/components/buyer-dashboard-view";
import { BUYER_LOCKED_UPSELLS } from "@/lib/buyer-shell";
import { textLinkClassName } from "@/components/text-link";
import { EmptyState } from "@/components/empty-state";
import {
  COACH_DISCOVERY_EMPTY_ADDRESS,
  COACH_DISCOVERY_STAGE_LABEL,
  COACH_FIRST_SESSION_STARTERS,
  isCoachDiscoveryEmptyScope,
} from "@/lib/coach-first-session";
import { COACH_ENTRY_PRICE_LABEL } from "@/lib/pricing";
import type { ConciergeAvailability } from "@/lib/concierge-availability";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";

export function CoachHome({
  scope,
  buyerName,
  eyebrow,
  availability = "ready",
  dashboardView = null,
  habitStorageKey,
}: {
  scope: ConciergeScope;
  buyerName: string;
  eyebrow?: string;
  availability?: ConciergeAvailability;
  dashboardView?: BuyerDashboardView | null;
  /** Fixture `/test-login` continuity — localStorage thread + daily check-in. */
  habitStorageKey?: string;
}) {
  const firstSession = isCoachDiscoveryEmptyScope(scope);
  const coachUnavailable = availability === "model_key_missing";
  const firstName = buyerName.split(" ")[0] ?? buyerName;
  const showTenSecond = dashboardView !== null && !firstSession;

  return (
    <div
      data-testid="coach-home"
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,18rem)] lg:items-start"
    >
      <section
        aria-label="Personal coach"
        className={cn(
          "flex min-h-0 flex-col overflow-x-hidden rounded-2xl border border-border/80 bg-card shadow-sm max-md:overflow-y-hidden",
          "max-md:max-h-[calc(100dvh-var(--coach-mobile-chrome)-var(--coach-compose-clearance))]",
          "md:min-h-[min(70vh,640px)]",
        )}
      >
        <header
          data-testid="concierge-scope"
          className={cn(
            "shrink-0 border-b border-border/70 px-5 pt-5 pb-4",
            firstSession && "max-md:pt-4 max-md:pb-3",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Personal coach
            </p>
            <Link
              href="/pricing"
              data-testid="coach-pricing-link"
              className={cn(
                textLinkClassName,
                "max-w-full text-small font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="md:hidden">
                {COACH_ENTRY_PRICE_LABEL} · See pricing
              </span>
              <span className="hidden md:inline">
                Coach — {COACH_ENTRY_PRICE_LABEL} · See pricing
              </span>
            </Link>
          </div>
          {eyebrow ? (
            <p
              className={cn(
                "mt-1 text-small text-muted-foreground",
                (firstSession || showTenSecond) && "max-md:hidden",
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          {!showTenSecond ? (
            <h1
              className={cn(
                "mt-0.5 font-semibold tracking-tight text-balance",
                firstSession
                  ? "max-md:text-h3 md:truncate md:text-h2"
                  : "truncate text-h2",
              )}
            >
              {firstSession ? COACH_DISCOVERY_STAGE_LABEL : scope.address}
            </h1>
          ) : null}
          {firstSession ? (
            <p className="mt-0.5 text-small text-muted-foreground md:sr-only">
              {COACH_DISCOVERY_EMPTY_ADDRESS}
            </p>
          ) : null}
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-body text-muted-foreground max-md:text-small">
            {!showTenSecond ? (
              <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-sage px-2.5 text-eyebrow font-medium text-sage-foreground">
                {scope.stage}
              </span>
            ) : null}
            <span>
              {firstSession
                ? `Hi ${firstName} — your coach for this purchase.`
                : `Hi ${firstName} — I explain this file only. I never advise.`}
            </span>
          </p>
          {habitStorageKey ? (
            <CoachReturnHeaderHint
              storageKey={habitStorageKey}
              firstSession={firstSession}
            />
          ) : null}
        </header>
        {showTenSecond ? (
          habitStorageKey ? (
            <CoachTenSecondReturnGate
              storageKey={habitStorageKey}
              firstSession={firstSession}
              className="shrink-0 border-b border-border/70 px-5 py-4"
            >
              <TenSecondHeroGrid
                view={dashboardView}
                buyerName={buyerName}
                journeyOrientation="horizontal"
                detailHref={transactionHref(dashboardView!.transactionId)}
                variant="coach"
              />
            </CoachTenSecondReturnGate>
          ) : (
            <div
              data-testid="coach-ten-second"
              className="shrink-0 border-b border-border/70 px-5 py-4"
            >
              <TenSecondHeroGrid
                view={dashboardView}
                buyerName={buyerName}
                journeyOrientation="horizontal"
                detailHref={transactionHref(dashboardView.transactionId)}
                variant="coach"
              />
            </div>
          )
        ) : null}
        {habitStorageKey ? (
          <CoachHabitConcierge
            storageKey={habitStorageKey}
            firstSession={firstSession}
            stageLabel={scope.stage}
            firstName={firstName}
            className={cn(
              "min-h-0 flex-1 px-5 pb-5",
              firstSession ? "pt-2 max-md:pt-2 md:pt-4" : "pt-4",
            )}
            availability={availability}
            showAgentLinkWhenUnavailable={!firstSession}
            starters={
              firstSession ? COACH_FIRST_SESSION_STARTERS : undefined
            }
            pinStartersAboveScrollOnMobile={firstSession && !coachUnavailable}
            scrollIntro={
              firstSession && !coachUnavailable
                ? (
                    <EmptyState
                      testId="coach-first-session-empty"
                      icon={MessageCircle}
                      title="Coach is on"
                      description={
                        <>
                          Tap a starter or ask below. Search, Pipeline, Tours, and
                          Vault unlock with the full OS —{" "}
                          <Link href="/pricing" className={textLinkClassName}>
                            see pricing
                          </Link>
                          .
                        </>
                      }
                      className="border-solid bg-muted/25 max-md:gap-2 max-md:py-4 max-md:[&_[data-slot=empty-title]]:text-h3 max-md:[&_[data-slot=empty-description]]:text-small"
                    />
                  )
                : undefined
            }
            idleHint={
              firstSession
                ? "Tap a starter or type a question."
                : undefined
            }
            questionPlaceholder={
              firstSession ? "Ask about buying" : undefined
            }
          />
        ) : (
          <ConciergeChat
            className={cn(
              "min-h-0 flex-1 px-5 pb-5",
              firstSession ? "pt-2 max-md:pt-2 md:pt-4" : "pt-4",
            )}
            availability={availability}
            showAgentLinkWhenUnavailable={!firstSession}
            starters={
              firstSession ? COACH_FIRST_SESSION_STARTERS : undefined
            }
            pinStartersAboveScrollOnMobile={firstSession && !coachUnavailable}
            scrollIntro={
              firstSession && !coachUnavailable
                ? (
                    <EmptyState
                      testId="coach-first-session-empty"
                      icon={MessageCircle}
                      title="Coach is on"
                      description={
                        <>
                          Tap a starter or ask below. Search, Pipeline, Tours, and
                          Vault unlock with the full OS —{" "}
                          <Link href="/pricing" className={textLinkClassName}>
                            see pricing
                          </Link>
                          .
                        </>
                      }
                      className="border-solid bg-muted/25 max-md:gap-2 max-md:py-4 max-md:[&_[data-slot=empty-title]]:text-small"
                    />
                  )
                : undefined
            }
            idleHint={
              firstSession
                ? "Tap a starter or type a question."
                : undefined
            }
            questionPlaceholder={
              firstSession ? "Ask about buying" : undefined
            }
          />
        )}
      </section>

      <BuyerLockedUpsellRail upsells={BUYER_LOCKED_UPSELLS} />
    </div>
  );
}
