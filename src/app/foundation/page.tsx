import Link from "next/link";

import { loadFoundation } from "@/app/actions/foundation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function FoundationPage() {
  const foundation = await loadFoundation();

  return (
    <div className="min-h-full bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <p className="text-sm font-semibold tracking-tight">HomeBase</p>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        <section className="space-y-3">
          <Badge variant="outline">Convex schema</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            Foundation data
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Seeded Lookout Realty has eight buyers with distinct transactions
            and one agent. Convex queries deny unauthenticated callers and deny
            the vendor role on every transaction-scoped read.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{foundation.org.name}</CardTitle>
              <CardDescription>
                {foundation.org.state} · {foundation.agent.name}, agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {foundation.buyers.map((buyer) => (
                <div key={buyer.name} className="rounded-lg border px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{buyer.name}</p>
                    <Badge variant="secondary">{buyer.stage}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {buyer.owedToday.label} · {buyer.owedToday.provenance} · $
                    {(buyer.owedToday.amountCents / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required P0 tables</CardTitle>
              <CardDescription>
                auditLog is append-only. No update or delete function exists.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {foundation.tables.map((table) => (
                <Badge key={table} variant="outline">
                  {table}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Org-configurable stages</CardTitle>
              <CardDescription>
                Lookout Realty&apos;s journey. Broker and admin can replace this
                list. Stage advance is blocked while a blocking task is open.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {foundation.stages.map((stage) => (
                <div
                  key={stage.key}
                  className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{stage.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {stage.defaultTasks.length === 0
                        ? "No default tasks"
                        : stage.defaultTasks
                            .map((task) =>
                              task.blocksStage
                                ? `${task.title} (blocks)`
                                : task.title,
                            )
                            .join(" · ")}
                    </p>
                  </div>
                  <Badge variant="outline">{String(stage.order).padStart(2, "0")}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Flags on the seeded org</CardTitle>
              <CardDescription>
                Stored on orgs.flags and default off. Same keys as the home page.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(foundation.flags).map(([key, value]) => (
                <Badge key={key} variant={value ? "default" : "outline"}>
                  {key} {value ? "on" : "off"}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
