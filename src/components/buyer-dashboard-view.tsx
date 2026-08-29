import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { isIssuedMoney } from "../../convex/lib/dashboardView";

function formatMoney(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
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
  const issued = owed !== null && isIssuedMoney(owed);

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
              {owed?.label ?? "No amount on this file"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">
              {owed ? formatMoney(owed.amountCents) : "$0.00"}
            </p>
            {owed ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant={issued ? "default" : "outline"}>
                  {owed.provenance}
                </Badge>
                <Badge variant="secondary">
                  {issued ? "issued" : "estimate"}
                </Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
