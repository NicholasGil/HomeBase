import { startTestSessionFromForm } from "@/app/actions/test-session";
import { Button } from "@/components/ui/button";
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
import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";

type PersonaCardProps = {
  title: string;
  description: string;
  clerkId: string;
  emptyCoachFile?: boolean;
  testId?: string;
  variant?: "default" | "secondary" | "outline";
};

function PersonaCard({
  title,
  description,
  clerkId,
  emptyCoachFile,
  testId,
  variant = "default",
}: PersonaCardProps) {
  return (
    <Card size="sm" className="overflow-hidden">
      <CardHeader className="gap-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={startTestSessionFromForm} data-testid={testId}>
          <input type="hidden" name="clerkId" value={clerkId} />
          {emptyCoachFile ? (
            <input type="hidden" name="emptyCoachFile" value="1" />
          ) : null}
          <Button type="submit" variant={variant} className="w-full">
            Continue
          </Button>
        </form>
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
          clerkId={SEED_CLERK_IDS.buyerA}
          testId="demo-persona-buyer-coach"
        />
        <PersonaCard
          title="Buyer — first session"
          description={`${alex?.name ?? "Alex Rivera"} without a property yet—see discovery coach flow.`}
          clerkId={SEED_CLERK_IDS.buyerA}
          emptyCoachFile
          variant="secondary"
          testId="demo-persona-buyer-discovery"
        />
        <PersonaCard
          title="Agent command center"
          description={`${SEED_PLAN.agent.name} at ${SEED_PLAN.org.name}—pipeline, roster, and exceptions.`}
          clerkId={SEED_PLAN.agent.clerkId}
          testId="demo-persona-agent"
        />
        <PersonaCard
          title="Lender / vendor portal"
          description={`${SEED_PLAN.lender.name}—vendor tasks and document handoffs on active files.`}
          clerkId={SEED_PLAN.lender.clerkId}
          variant="outline"
          testId="demo-persona-vendor"
        />
        <PersonaCard
          title="New agent — brokerage onboarding"
          description="Taylor Brooks starting a new brokerage workspace from invite through first roster."
          clerkId={SEED_CLERK_IDS.onboardingAgent}
          variant="secondary"
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
