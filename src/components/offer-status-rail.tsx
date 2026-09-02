import { Check, Lock, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type OfferRailState = "done" | "current" | "upcoming" | "locked";

export type OfferRailStep = {
  key: "draft" | "review" | "submit" | "esign";
  label: string;
  state: OfferRailState;
  detail: string;
};

export const ESIGN_LOCKED_DETAIL = "Available after e-sign is enabled";

/**
 * Pure step derivation for the offer status rail. Submit and E-sign are
 * locked whenever e-sign is off: the server rejects submit with
 * ESIGN_NOT_ENABLED before it even reaches the licensee check, so the rail
 * must not present those steps as reachable (and never links to /sign).
 */
export function offerRailSteps(input: {
  offer: {
    status: string;
    reviewedByLicenseeId: string | null;
    submittedAt: number | null;
  } | null;
  esignEnabled: boolean;
}): OfferRailStep[] {
  const { offer, esignEnabled } = input;
  const reviewed =
    offer !== null &&
    offer.reviewedByLicenseeId !== null &&
    offer.reviewedByLicenseeId.length > 0;
  const submitted =
    offer !== null && (offer.status === "submitted" || offer.submittedAt !== null);

  const draft: OfferRailStep = {
    key: "draft",
    label: "Draft",
    state: offer === null ? "current" : "done",
    detail: offer === null ? "No draft yet" : `Status ${offer.status}`,
  };

  const review: OfferRailStep = {
    key: "review",
    label: "Licensee review",
    state:
      offer === null ? "upcoming" : reviewed ? "done" : "current",
    detail:
      offer === null
        ? "Starts once a draft exists"
        : reviewed
          ? "Reviewed by your licensee"
          : "Waiting on your licensee",
  };

  const submit: OfferRailStep = {
    key: "submit",
    label: "Submit",
    state: !esignEnabled
      ? "locked"
      : submitted
        ? "done"
        : reviewed
          ? "current"
          : "upcoming",
    detail: !esignEnabled
      ? ESIGN_LOCKED_DETAIL
      : submitted
        ? "Submitted"
        : reviewed
          ? "Ready for licensee-approved submit"
          : "After licensee review",
  };

  const esign: OfferRailStep = {
    key: "esign",
    label: "E-sign",
    state: !esignEnabled ? "locked" : submitted ? "current" : "upcoming",
    detail: !esignEnabled
      ? ESIGN_LOCKED_DETAIL
      : submitted
        ? "Next: prepare the packet"
        : "After submit",
  };

  return [draft, review, submit, esign];
}

const STATE_NODE_CLASS: Record<OfferRailState, string> = {
  done: "bg-foreground text-background",
  current: "bg-next text-next-foreground ring-4 ring-next/20",
  upcoming: "border border-border bg-background text-muted-foreground",
  locked: "border border-dashed border-border bg-muted text-muted-foreground",
};

function nodeIcon(state: OfferRailState): LucideIcon | null {
  if (state === "done") {
    return Check;
  }
  if (state === "locked") {
    return Lock;
  }
  return null;
}

/**
 * Offer status rail: Draft → Licensee review → Submit → E-sign. Vertical on
 * small screens, four columns from `sm`. Locked steps are grayed with a lock
 * icon and carry their unlock condition as plain text; nothing in the rail is
 * a link, so a locked step never routes anywhere.
 */
export function OfferStatusRail({
  steps,
  className,
}: {
  steps: OfferRailStep[];
  className?: string;
}) {
  return (
    <ol
      data-testid="offer-status-rail"
      aria-label="Offer progress"
      className={cn(
        "grid gap-2 rounded-xl bg-muted/40 p-2 sm:grid-cols-4 sm:gap-3 sm:p-3",
        className,
      )}
    >
      {steps.map((step, index) => {
        const Icon = nodeIcon(step.state);
        const locked = step.state === "locked";
        return (
          <li
            key={step.key}
            data-testid={`offer-rail-${step.key}`}
            data-state={step.state}
            aria-current={step.state === "current" ? "step" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 sm:min-h-0 sm:flex-col sm:items-start sm:gap-2 sm:px-1",
              locked ? "text-muted-foreground/80" : "text-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                STATE_NODE_CLASS[step.state],
              )}
            >
              {Icon ? <Icon className="size-3.5" /> : index + 1}
            </span>
            <span className="min-w-0 leading-tight">
              <span
                className={cn(
                  "block text-sm font-medium",
                  locked ? "text-muted-foreground" : undefined,
                )}
              >
                {step.label}
                {locked ? <span className="sr-only"> (locked)</span> : null}
              </span>
              <span className="block text-xs text-muted-foreground">
                {step.detail}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
