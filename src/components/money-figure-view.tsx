import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  ESTIMATE_AMOUNT_CLASS_NAME,
  ISSUED_AMOUNT_CLASS_NAME,
  owedTodayDisplay,
} from "@/lib/owed-today-display";
import { cn } from "@/lib/utils";
import type { MoneyFigure, MoneyProvenance } from "../../convex/lib/offerModel";

export type MoneyFigureSize = "sm" | "md" | "display";

export const ASSUMPTIONS_LABEL = "Assumptions";
/** DOM id of the offer simulator's assumptions panel; estimates on /offers link here. */
export const ASSUMPTIONS_PANEL_ID = "assumptions-panel";

/**
 * The display-size classes are the canonical ones exported from
 * owed-today-display; smaller sizes swap only the font-size token so the
 * three cues (face, eyebrow, badge) stay identical at every size.
 */
const AMOUNT_SIZE_CLASS: Record<
  "issued" | "estimate" | "missing",
  Record<MoneyFigureSize, string>
> = {
  issued: { sm: "text-base", md: "text-2xl", display: "lg:text-5xl" },
  estimate: { sm: "text-base", md: "text-xl", display: "lg:text-4xl" },
  missing: { sm: "text-sm", md: "text-base", display: "text-lg" },
};

const EYEBROW_CLASS: Record<MoneyFigureSize, string> = {
  sm: "text-[10px]",
  md: "text-[11px]",
  display: "text-xs",
};

const ESTIMATE_NOTE: Record<MoneyProvenance, string> = {
  ai_estimate:
    "Modeled by HomeBase from this file. Not issued by a lender or title company.",
  user_entered:
    "Entered on this file. Not verified by a lender or title company.",
  lender_issued: "Issued by the lender on this file.",
  title_issued: "Issued by the title company on this file.",
};

const AS_OF_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatAsOf(asOf: number) {
  return AS_OF_FORMAT.format(asOf);
}

function AssumptionsDisclosure({
  figure,
  href,
  lines,
  size,
}: {
  figure: MoneyFigure;
  href?: string;
  lines?: readonly string[];
  size: MoneyFigureSize;
}) {
  return (
    <details
      className={cn(
        "group/assumptions min-w-0 not-italic",
        size === "sm" ? "basis-full" : null,
      )}
      data-slot="money-assumptions"
    >
      <summary className="inline-flex min-h-5 cursor-pointer list-none items-center text-xs font-medium text-sky-foreground underline decoration-sky-foreground/40 underline-offset-4 hover:decoration-sky-foreground marker:content-none focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring/50">
        {ASSUMPTIONS_LABEL}
      </summary>
      <div className="mt-2 space-y-1 rounded-lg bg-sky/50 px-3 py-2 text-left text-xs leading-relaxed text-sky-foreground">
        <p>{ESTIMATE_NOTE[figure.provenance]}</p>
        {figure.asOf > 0 ? <p>As of {formatAsOf(figure.asOf)}.</p> : null}
        {lines?.map((line) => <p key={line}>{line}</p>)}
        {href ? (
          <a
            href={href}
            className="inline-block font-medium underline underline-offset-4"
          >
            Open the assumptions panel
          </a>
        ) : null}
      </div>
    </details>
  );
}

/**
 * The single renderer for every dollar figure. Three cues at every size:
 * issued figures are mono, semibold, tabular with a dark provenance badge;
 * estimates are italic sans with an ESTIMATE eyebrow, sky provenance badge,
 * and a reachable Assumptions disclosure. A missing figure is "None".
 */
export function MoneyFigureView({
  figure,
  testId,
  size = "display",
  showLabel = true,
  assumptionsHref,
  assumptions,
  className,
}: {
  figure: MoneyFigure | null | undefined;
  testId?: string;
  size?: MoneyFigureSize;
  /** Set false when the surrounding surface already names the figure. */
  showLabel?: boolean;
  /** Anchor to a visible assumptions panel, e.g. the offer simulator. */
  assumptionsHref?: string;
  /** Extra assumption lines specific to the surface (estimates only). */
  assumptions?: readonly string[];
  className?: string;
}) {
  const display = owedTodayDisplay(figure);

  if (display.kind === "missing" || figure === null || figure === undefined) {
    return (
      <div
        className={cn("min-w-0", className)}
        data-testid={testId}
        data-figure="missing"
      >
        <p
          className={cn(
            display.amountClassName,
            AMOUNT_SIZE_CLASS.missing[size],
          )}
        >
          {display.amountText}
        </p>
      </div>
    );
  }

  const isEstimate = display.kind === "estimate";
  const amountClassName = cn(
    isEstimate ? ESTIMATE_AMOUNT_CLASS_NAME : ISSUED_AMOUNT_CLASS_NAME,
    AMOUNT_SIZE_CLASS[display.kind][size],
    "leading-none",
  );
  const label = showLabel && figure.label ? figure.label : null;

  let eyebrow: ReactNode = null;
  if (isEstimate) {
    eyebrow = (
      <span
        className={cn(
          "font-sans font-semibold tracking-[0.18em] text-sky-foreground uppercase not-italic",
          EYEBROW_CLASS[size],
        )}
        data-slot="money-eyebrow"
      >
        {display.estimateLabel}
      </span>
    );
  }

  const badges = (
    <>
      <Badge variant={isEstimate ? "sky" : "default"}>{figure.provenance}</Badge>
      <Badge variant={isEstimate ? "sky" : "outline"}>
        {isEstimate ? "estimate" : "issued"}
      </Badge>
    </>
  );

  if (size === "sm") {
    return (
      <div
        className={cn("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1", className)}
        data-testid={testId}
        data-provenance={figure.provenance}
        data-figure={display.kind}
      >
        {label ? (
          <span className="basis-full text-xs text-muted-foreground">{label}</span>
        ) : null}
        <p className={cn(amountClassName, "inline-flex items-baseline gap-1.5")}>
          {eyebrow}
          <span>{display.amountText}</span>
        </p>
        {badges}
        {isEstimate ? (
          <AssumptionsDisclosure
            figure={figure}
            href={assumptionsHref}
            lines={assumptions}
            size={size}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn("min-w-0 space-y-2", className)}
      data-testid={testId}
      data-provenance={figure.provenance}
      data-figure={display.kind}
    >
      {label ? (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      ) : null}
      {eyebrow ? <p className="leading-none">{eyebrow}</p> : null}
      <p className={amountClassName}>{display.amountText}</p>
      <div className="flex flex-wrap items-center gap-2">
        {badges}
        {isEstimate ? (
          <AssumptionsDisclosure
            figure={figure}
            href={assumptionsHref}
            lines={assumptions}
            size={size}
          />
        ) : null}
      </div>
    </div>
  );
}
