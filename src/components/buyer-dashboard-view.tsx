import { Badge } from "@/components/ui/badge";
import { JourneyTracker } from "@/components/journey-tracker";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import {
  ESTIMATE_AMOUNT_CLASS_NAME,
  ISSUED_AMOUNT_CLASS_NAME,
  owedTodayDisplay,
} from "@/lib/owed-today-display";

export function OwedTodayFigure({
  owed,
  featured,
}: {
  owed: BuyerDashboardView["owedToday"];
  featured?: boolean;
}) {
  const display = owedTodayDisplay(owed);
  const amountClassName =
    featured && display.kind === "issued"
      ? ISSUED_AMOUNT_CLASS_NAME.replace("text-3xl", "text-5xl")
      : featured && display.kind === "estimate"
        ? ESTIMATE_AMOUNT_CLASS_NAME.replace("text-2xl", "text-3xl")
        : display.amountClassName;

  switch (display.kind) {
    case "missing":
      return (
        <p className={display.amountClassName}>{display.amountText}</p>
      );
    case "estimate":
      return (
        <div className="space-y-2">
          <p className={amountClassName}>
            <span className="mr-2 align-middle text-xs font-semibold not-italic tracking-[0.18em]">
              {display.estimateLabel}
            </span>
            {display.amountText}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{display.provenance}</Badge>
            <Badge variant="secondary">estimate</Badge>
          </div>
        </div>
      );
    case "issued":
      return (
        <div className="space-y-2">
          <p className={amountClassName}>{display.amountText}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">{display.provenance}</Badge>
            <Badge variant="secondary">issued</Badge>
          </div>
        </div>
      );
    default: {
      const _exhaustive: never = display;
      return _exhaustive;
    }
  }
}

export function BuyerDashboardViewPanel({
  view,
  buyerName,
  eyebrow,
}: {
  view: BuyerDashboardView;
  buyerName?: string;
  eyebrow?: string;
}) {
  const owed = view.owedToday;

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="space-y-3">
          {eyebrow ? <Badge variant="outline">{eyebrow}</Badge> : null}
          <p className="text-sm text-muted-foreground">
            {buyerName ?? "Your transaction"}
            {view.propertyAddress
              ? ` · ${view.propertyAddress.city}, ${view.propertyAddress.state}`
              : null}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1
                data-testid="ten-second-where"
                className="text-4xl font-semibold tracking-tight"
              >
                {view.where.label}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Status {view.where.status}. Transaction {view.transactionId}.
              </p>
            </div>
            <JourneyTracker stages={view.stages} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <section
            data-testid="ten-second-next"
            className="rounded-2xl bg-next/10 px-6 py-7"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-next">
              Next
            </p>
            {view.next === null ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No open task right now.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-3xl font-semibold tracking-tight text-balance">
                  {view.next.title}
                </p>
                <Badge variant="secondary">{view.next.assigneeRole}</Badge>
              </div>
            )}
          </section>

          <section
            data-testid="ten-second-owe"
            className="rounded-2xl bg-card px-6 py-7 ring-1 ring-foreground/6"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Due today
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {owed?.label ?? "No sourced figure on this file"}
            </p>
            <div className="mt-4">
              <OwedTodayFigure owed={owed} featured />
            </div>
          </section>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <section data-testid="ten-second-done">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Done
            </p>
            {view.done.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Nothing marked done yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {view.done.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>

          <section data-testid="ten-second-waiting">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Waiting on
            </p>
            <p className="mt-2 text-lg font-medium">
              {view.waitingOn ?? "Nobody"}
            </p>
          </section>
        </div>
      </section>

      <section className="grid gap-8 border-t border-border/60 pt-8 md:grid-cols-3">
        <div>
          <h2 className="text-sm font-medium">This stage</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks that live on {view.where.label}.
          </p>
          {view.currentStageTasks.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No tasks on this stage.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {view.currentStageTasks.map((task) => (
                <li
                  key={task.title}
                  className="flex items-center justify-between gap-2"
                >
                  <span>{task.title}</span>
                  <Badge variant="outline">{task.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium">Waiting and deadlines</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stage advance stays blocked while a blocking task is open.
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {view.canAdvance ? (
              <p>Ready for {view.nextStage?.label ?? "the next stage"}.</p>
            ) : (
              <p data-testid="stage-blocked">
                Cannot leave {view.where.label}
                {view.blockingTasks[0]
                  ? ` while ${view.blockingTasks[0].title} is open.`
                  : "."}
              </p>
            )}
            {view.deadlines.map((deadline) => (
              <p key={deadline.label} className="text-muted-foreground">
                {deadline.label}
              </p>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium">Contacts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            People on this file.
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {view.contacts.length === 0 ? (
              <p className="text-muted-foreground">No contacts yet.</p>
            ) : (
              view.contacts.map((contact) => (
                <p key={`${contact.role}-${contact.name}`}>
                  {contact.name} · {contact.role}
                </p>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
