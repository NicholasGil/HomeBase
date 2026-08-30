import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JourneyTracker } from "@/components/journey-tracker";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { owedTodayDisplay } from "@/lib/owed-today-display";

export function OwedTodayFigure({
  owed,
}: {
  owed: BuyerDashboardView["owedToday"];
}) {
  const display = owedTodayDisplay(owed);

  switch (display.kind) {
    case "missing":
      return (
        <p className={display.amountClassName}>{display.amountText}</p>
      );
    case "estimate":
      return (
        <div className="space-y-2">
          <p className={display.amountClassName}>
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
          <p className={display.amountClassName}>{display.amountText}</p>
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
      <section className="space-y-2">
        {eyebrow ? <Badge variant="outline">{eyebrow}</Badge> : null}
        <p className="text-sm text-muted-foreground">
          {buyerName ?? "Your transaction"}
          {view.propertyAddress
            ? ` · ${view.propertyAddress.city}, ${view.propertyAddress.state}`
            : null}
        </p>
        <h1
          data-testid="ten-second-where"
          className="text-3xl font-semibold tracking-tight"
        >
          {view.where.label}
        </h1>
        <p className="text-sm text-muted-foreground">
          Status {view.where.status}. Transaction {view.transactionId}.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Journey
        </h2>
        <JourneyTracker stages={view.stages} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card data-testid="ten-second-done">
          <CardHeader>
            <CardTitle>What is done</CardTitle>
            <CardDescription>Completed work on this file.</CardDescription>
          </CardHeader>
          <CardContent>
            {view.done.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing marked done yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {view.done.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card data-testid="ten-second-next">
          <CardHeader>
            <CardTitle>What is next</CardTitle>
            <CardDescription>First open task that is not blocked.</CardDescription>
          </CardHeader>
          <CardContent>
            {view.next === null ? (
              <p className="text-sm text-muted-foreground">No open task right now.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">{view.next.title}</p>
                <Badge variant="secondary">{view.next.assigneeRole}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="ten-second-waiting">
          <CardHeader>
            <CardTitle>Who you are waiting on</CardTitle>
            <CardDescription>Role that owns the next move.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{view.waitingOn ?? "Nobody"}</p>
          </CardContent>
        </Card>

        <Card data-testid="ten-second-owe">
          <CardHeader>
            <CardTitle>What you owe today</CardTitle>
            <CardDescription>
              {owed?.label ?? "No sourced figure on this file"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OwedTodayFigure owed={owed} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>This stage</CardTitle>
            <CardDescription>Tasks that live on {view.where.label}.</CardDescription>
          </CardHeader>
          <CardContent>
            {view.currentStageTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks on this stage.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {view.currentStageTasks.map((task) => (
                  <li key={task.title} className="flex items-center justify-between gap-2">
                    <span>{task.title}</span>
                    <Badge variant="outline">{task.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waiting and deadlines</CardTitle>
            <CardDescription>
              Stage advance stays blocked while a blocking task is open.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>People on this file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {view.contacts.length === 0 ? (
              <p className="text-muted-foreground">No contacts yet.</p>
            ) : (
              view.contacts.map((contact) => (
                <p key={`${contact.role}-${contact.name}`}>
                  {contact.name} · {contact.role}
                </p>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
