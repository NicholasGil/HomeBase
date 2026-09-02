import Link from "next/link";

import { AccessDeniedCard } from "@/components/access-denied-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CommandCenterView } from "../../convex/lib/commandCenter";

function clientKey(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function AgentCommandCenterView({
  view,
  agentName,
  eyebrow,
}: {
  view: CommandCenterView;
  agentName?: string;
  eyebrow?: string;
}) {
  return (
    <div className="space-y-8" data-testid="command-center">
      <section className="space-y-2">
        {eyebrow ? <Badge variant="sage">{eyebrow}</Badge> : null}
        <p className="text-sm text-muted-foreground">
          {agentName ?? "Assigned clients"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Command center
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Every assigned client and today&apos;s exceptions. Priority is the
          daily list.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card data-testid="command-center-priority">
          <CardHeader>
            <CardTitle>Today</CardTitle>
            <CardDescription>
              Exceptions first, then the rest of the book.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {view.priority.map((client, index) => (
                <li
                  key={client.clientId}
                  data-testid={`priority-${index + 1}`}
                  data-client-name={client.name}
                  data-stage={client.stage}
                  className="rounded-lg border px-3 py-3"
                >
                  <Link
                    href={`/transactions/${client.transactionId}`}
                    className="block"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.priorityReason}
                        </p>
                      </div>
                      <Badge
                        variant={
                          client.exceptions.length > 0 ? "destructive" : "outline"
                        }
                      >
                        {client.stageLabel}
                      </Badge>
                    </div>
                    {client.exceptions.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {client.exceptions.map((exception) => (
                          <Badge key={exception.kind} variant="secondary">
                            {exception.label}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card data-testid="command-center-roster">
          <CardHeader>
            <CardTitle>All clients</CardTitle>
            <CardDescription>Stage at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {view.roster.map((client) => (
                <li
                  key={client.clientId}
                  data-testid={`client-${clientKey(client.name)}`}
                  data-client-name={client.name}
                  data-stage={client.stage}
                  className="rounded-lg border px-3 py-2"
                >
                  <Link
                    href={`/transactions/${client.transactionId}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.propertyCity
                          ? `${client.propertyCity}, ${client.propertyState}`
                          : "No property yet"}
                        {client.nextTask ? ` · ${client.nextTask.title}` : ""}
                      </p>
                    </div>
                    <Badge variant="sage">{client.stageLabel}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export function CommandCenterDenied() {
  return (
    <AccessDeniedCard
      testId="command-center-denied"
      title="You cannot open the command center."
    />
  );
}
