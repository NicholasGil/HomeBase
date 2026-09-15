import Link from "next/link";

import { ConciergeChat } from "@/components/concierge-chat";
import {
  BuyerLockedUpsellRail,
} from "@/components/buyer-locked-upsell";
import type { ConciergeScope } from "@/components/concierge-sheet";
import { BUYER_LOCKED_UPSELLS } from "@/lib/buyer-shell";
import { textLinkClassName } from "@/components/text-link";
import { EmptyState } from "@/components/empty-state";
import {
  COACH_FIRST_SESSION_STARTERS,
  isCoachDiscoveryEmptyScope,
} from "@/lib/coach-first-session";
import { COACH_ENTRY_PRICE_LABEL } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

export function CoachHome({
  scope,
  buyerName,
  eyebrow,
}: {
  scope: ConciergeScope;
  buyerName: string;
  eyebrow?: string;
}) {
  const firstSession = isCoachDiscoveryEmptyScope(scope);
  const firstName = buyerName.split(" ")[0];

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
              Coach — {COACH_ENTRY_PRICE_LABEL} · See pricing
            </Link>
          </div>
          {eyebrow ? (
            <p
              className={cn(
                "mt-1 text-small text-muted-foreground",
                firstSession && "max-md:hidden",
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              "mt-1 truncate text-h2 font-semibold tracking-tight",
              firstSession && "max-md:text-lg",
            )}
          >
            {scope.address}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-body text-muted-foreground">
            <span className="inline-flex h-6 items-center rounded-full bg-sage px-2.5 text-eyebrow font-medium text-sage-foreground">
              {scope.stage}
            </span>
            <span
              className={cn(firstSession && "max-md:line-clamp-1 max-md:max-w-full")}
            >
              {firstSession
                ? `Hi ${firstName} — your always-on coach for this purchase. I explain; I never advise.`
                : `Hi ${firstName} — I explain this file only. I never advise.`}
            </span>
          </p>
        </header>
        <ConciergeChat
          className={cn(
            "min-h-0 flex-1 px-5 pb-5",
            firstSession ? "pt-2 max-md:pt-2 md:pt-4" : "pt-4",
          )}
          starters={
            firstSession ? COACH_FIRST_SESSION_STARTERS : undefined
          }
          pinStartersAboveScrollOnMobile={firstSession}
          scrollIntro={
            firstSession
              ? (
                  <EmptyState
                    testId="coach-first-session-empty"
                    icon={MessageCircle}
                    title="Your personal coach is on"
                    description={
                      <>
                        HomeBase coach is your daily guide through buying — one
                        place to ask what things mean and what usually comes
                        next. The {COACH_ENTRY_PRICE_LABEL} entry keeps coach
                        on while you explore; Search, Pipeline, Tours, and Vault
                        unlock when your agent adds them to your file. Tap a
                        starter above or type a question — when you have a
                        property, answers stay tied to that file only.
                      </>
                    }
                    action={{ href: "/pricing", label: "See what’s included" }}
                    className="border-solid bg-muted/30 max-md:gap-3 max-md:py-5 max-md:[&_[data-slot=empty-description]]:line-clamp-4"
                  />
                )
              : undefined
          }
          idleHint={
            firstSession
              ? "Tap a starter to learn how coach works, or ask anything about buying."
              : undefined
          }
          questionPlaceholder={
            firstSession ? "Ask about buying or a document" : undefined
          }
        />
      </section>

      <BuyerLockedUpsellRail upsells={BUYER_LOCKED_UPSELLS} />
    </div>
  );
}
