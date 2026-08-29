import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <div className="space-y-1">
          <p className="text-lg text-muted-foreground">{display.statusLabel}</p>
        </div>
      );
    case "estimate":
      return (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {display.statusLabel}
          </p>
          <p className="text-2xl font-normal text-muted-foreground italic tabular-nums">
            {display.amountText}
          </p>
          <p className="text-xs text-muted-foreground">
            {display.label ? `${display.label}. ` : null}
            Provenance {display.provenance}.
          </p>
        </div>
      );
    case "issued":
      return (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase">
            {display.statusLabel}
          </p>
          <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
            {display.amountText}
          </p>
          <p className="text-xs">
            {display.label ? `${display.label}. ` : null}
            Provenance {display.provenance}.
          </p>
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
        <h1 className="text-3xl font-semibold tracking-tight">
          {view.where.label}
        </h1>
        <p className="text-sm text-muted-foreground">
          Status {view.where.status}. Transaction {view.transactionId}.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
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

        <Card>
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

        <Card>
          <CardHeader>
            <CardTitle>Who you are waiting on</CardTitle>
            <CardDescription>Role that owns the next move.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{view.waitingOn ?? "Nobody"}</p>
          </CardContent>
        </Card>

        <Card>
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
    </div>
  );
}
