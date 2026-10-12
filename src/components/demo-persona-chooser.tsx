import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isDemoMode } from "@/lib/auth-config";
import {
  fixtureSignInDescription,
  fixtureSignInTitle,
} from "@/lib/demo-copy";
import { DEMO_PERSONA_ENTER } from "@/lib/demo-persona-enter";
import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";

type PersonaCardProps = {
  title: string;
  description: string;
  enterHref: string;
  actionLabel: string;
  testId?: string;
};

function PersonaCard({
  title,
  description,
  enterHref,
  actionLabel,
  testId,
}: PersonaCardProps) {
  return (
    <Card size="sm" className="overflow-hidden" data-testid={testId}>
      <CardHeader className="gap-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <a
          href={enterHref}
          className={cn(
            buttonVariants({ variant: "default" }),
            "inline-flex min-h-11 w-full items-center justify-center",
          )}
        >
          {actionLabel}
        </a>
      </CardContent>
    </Card>
  );
}

export function DemoPersonaChooser() {
  const demo = isDemoMode();
  const alex = SEED_PLAN.buyers.find(
    (buyer) => buyer.clerkId === SEED_CLERK_IDS.buyerA,
  );

  return (
    <div
      className="mx-auto flex max-w-lg flex-col gap-6 px-5 py-8"
      data-testid="demo-persona-chooser"
    >
      <div className="space-y-2">
        <p className="text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase">
          RealtyRise demo
        </p>
        <h1 className="text-h1 font-semibold tracking-tight text-balance">
          {fixtureSignInTitle()}
        </h1>
        <p className="text-pretty text-body text-muted-foreground">
          {fixtureSignInDescription()}
        </p>
      </div>

      <div className="grid gap-3">
        <PersonaCard
          title="Buyer coach"
          description={`Personal coach for ${alex?.name ?? "Alex Rivera"} with an active purchase on file.`}
          enterHref={DEMO_PERSONA_ENTER.buyerCoach}
          actionLabel="Open Alex's coach"
          testId="demo-persona-buyer-coach"
        />
        <PersonaCard
          title="Buyer — first session"
          description={`${alex?.name ?? "Alex Rivera"} without a property yet—see discovery coach flow.`}
          enterHref={DEMO_PERSONA_ENTER.buyerDiscovery}
          actionLabel="Try Alex's first session"
          testId="demo-persona-buyer-discovery"
        />
        <PersonaCard
          title="Agent command center"
          description={`${SEED_PLAN.agent.name} at ${SEED_PLAN.org.name}—pipeline, roster, and exceptions.`}
          enterHref={DEMO_PERSONA_ENTER.agent}
          actionLabel="Open Casey's command center"
          testId="demo-persona-agent"
        />
        <PersonaCard
          title="Lender / vendor portal"
          description={`${SEED_PLAN.lender.name}—vendor tasks and document handoffs on active files.`}
          enterHref={DEMO_PERSONA_ENTER.vendor}
          actionLabel="Open Jordan's vendor portal"
          testId="demo-persona-vendor"
        />
        <PersonaCard
          title="New agent — brokerage onboarding"
          description="Taylor Brooks starting a new brokerage workspace from invite through first roster."
          enterHref={DEMO_PERSONA_ENTER.onboarding}
          actionLabel="Start Taylor's onboarding"
          testId="demo-persona-onboarding"
        />
      </div>

      {!demo ? (
        <p className="text-small text-muted-foreground">
          Preview and CI fixture login — not shown on production without demo
          mode.
        </p>
      ) : null}
    </div>
  );
}
