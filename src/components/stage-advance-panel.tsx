"use client";

import { ArrowRight, CircleDashed } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { cn } from "@/lib/utils";

export type StageAdvanceReason =
  | "ready"
  | "blocked"
  | "last-stage"
  | "unavailable";

export const FIXTURE_ADVANCE_UNAVAILABLE =
  "Advancing writes to the live file; this fixture preview is read-only.";

/**
 * The advance control is always on the page. It is enabled only when the
 * server-computed `canAdvance` is true; otherwise it stays visible, disabled,
 * with the reason beside it. Blocking logic lives in Convex, not here.
 */
export function stageAdvanceReason(
  view: Pick<BuyerDashboardView, "canAdvance" | "blockingTasks" | "nextStage">,
  hasHandler: boolean,
): { kind: StageAdvanceReason; text: string } {
  if (!view.canAdvance) {
    const blocker = view.blockingTasks[0];
    if (blocker) {
      return {
        kind: "blocked",
        text: `Blocked while ${blocker.title} is open.`,
      };
    }
    if (view.nextStage === null) {
      return { kind: "last-stage", text: "This file is on its last stage." };
    }
    return { kind: "blocked", text: "Blocked by an open task on this stage." };
  }
  if (!hasHandler) {
    return { kind: "unavailable", text: FIXTURE_ADVANCE_UNAVAILABLE };
  }
  return {
    kind: "ready",
    text: `Ready. No blocking task is open on this stage.`,
  };
}

export function StageAdvancePanel({
  view,
  onAdvance,
  busy = false,
  error = null,
  className,
}: {
  view: BuyerDashboardView;
  /** Omitted in the fixture preview, where no mutation exists to call. */
  onAdvance?: () => void;
  busy?: boolean;
  error?: string | null;
  className?: string;
}) {
  const reasonId = useId();
  const reason = stageAdvanceReason(view, onAdvance !== undefined);
  const disabled = busy || reason.kind !== "ready";

  return (
    <Card
      data-testid="stage-advance-panel"
      className={cn("hover:translate-y-0 hover:shadow-none", className)}
    >
      <CardHeader>
        <CardTitle>Advance stage</CardTitle>
        <CardDescription>
          Licensee action. Moves this file from {view.where.label}
          {view.nextStage ? ` to ${view.nextStage.label}` : " onward"}. Blocked
          while a blocking task on this stage is open.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button
            type="button"
            variant="next"
            data-testid="stage-advance"
            className="min-h-11 shrink-0 px-4"
            disabled={disabled}
            aria-describedby={reasonId}
            onClick={() => {
              onAdvance?.();
            }}
          >
            {busy
              ? "Advancing…"
              : view.nextStage
                ? `Advance to ${view.nextStage.label}`
                : "Advance stage"}
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Button>
          <p
            id={reasonId}
            data-testid="stage-advance-reason"
            data-reason={reason.kind}
            className={cn(
              "text-sm leading-5",
              reason.kind === "ready" ? "text-sage-foreground" : "text-muted-foreground",
            )}
          >
            {reason.text}
          </p>
        </div>
        {view.blockingTasks.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Still open on this stage
            </p>
            {/*
              A reason list, not a menu: plain rows with a status mark. There is
              no task route or buyer-side task action to send these to.
            */}
            <ul
              data-testid="stage-advance-blockers"
              aria-label="Blocking tasks"
              className="divide-y divide-border/70 text-sm"
            >
              {view.blockingTasks.map((task) => (
                <li
                  key={task.title}
                  className="flex items-center gap-3 py-2"
                >
                  <CircleDashed
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">{task.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {task.assigneeRole}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
