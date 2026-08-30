import Link from "next/link";

import { loadFeatureFlags } from "@/app/actions/flags";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_JOURNEY_STAGES,
  TEN_SECOND_QUESTIONS,
} from "@/lib/domain";
import { FEATURE_FLAG_KEYS } from "@/lib/flags";
import { cn } from "@/lib/utils";

const FLAG_COPY = {
  FLAG_MLS: "Live MLS / IDX inventory",
  FLAG_VENDOR_COMP: "Vendor compensation",
  FLAG_ESIGN: "E-signature providers",
  FLAG_IDV: "Vendor identity verification",
} as const;

export default async function HomePage() {
  const flags = await loadFeatureFlags();

  return (
    <div className="min-h-full bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <p className="text-sm font-semibold tracking-tight">HomeBase</p>
          <p className="text-xs text-muted-foreground">
            Buyer side · one brokerage · one market
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-12">
        <section className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div className="space-y-5">
            <Badge variant="outline">P0 foundation</Badge>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance">
              The operating system for buying a home
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              HomeBase carries one buyer from thinking about it through closing
              and into homeownership. Open the app cold. Within ten seconds you
              should know where you are, what is done, what is next, who you
              are waiting on, and what you owe today.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="#ten-second-test"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                See the ten-second test
              </Link>
              <Link
                href="/foundation"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Foundation data
              </Link>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Who this is for</CardTitle>
              <CardDescription>
                Roles from DESIGN.md. Routing lands in the Clerk slice.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {["buyer", "agent", "broker", "admin", "vendor"].map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </section>

        <section id="ten-second-test" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              The ten-second test
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              The buyer dashboard has to answer these five questions on first
              paint. That is the product intent, shown here as an early signal.
              The P0 gate is isolation: a seeded buyer sees their own
              transaction and cannot load another by URL.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {TEN_SECOND_QUESTIONS.map((question) => (
              <Card key={question.key} size="sm">
                <CardHeader>
                  <CardTitle>{question.label}</CardTitle>
                  <CardDescription>{question.detail}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="journey" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Journey roadmap
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Stages are org-configurable. This is the default path a north
              Alabama buyer walks with their agent.
            </p>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DEFAULT_JOURNEY_STAGES.map((stage) => (
              <li
                key={stage.key}
                className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(stage.order).padStart(2, "0")}
                </span>
                <span>{stage.label}</span>
              </li>
            ))}
          </ol>
        </section>

        <Separator />

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Feature flags stay off
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              MLS, vendor compensation, e-sign, and identity verification are
              gated. The server function returns these defaults. Nobody on this
              branch flips them.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURE_FLAG_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="font-mono text-sm">{key}</p>
                  <p className="text-xs text-muted-foreground">{FLAG_COPY[key]}</p>
                </div>
                <Badge variant={flags[key] ? "default" : "outline"}>
                  {flags[key] ? "on" : "off"}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>HomeBase · buyer transaction OS</p>
          <p>Listing and seller side are out of scope for this build.</p>
        </div>
      </footer>
    </div>
  );
}
