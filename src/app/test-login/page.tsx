import { startTestSessionFromForm } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  isProductionDeploy,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { SEED_CLERK_IDS, SEED_PLAN } from "../../../convex/seedPlan";

export const dynamic = "force-dynamic";

export default function TestLoginPage() {
  if (isProductionDeploy()) {
    throw new ProductionAuthMisconfiguredError();
  }

  return (
    <AppShell>
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Fixture sign in</CardTitle>
          <CardDescription>
            Test-mode login for local, CI, and preview. It is not Clerk. It is
            disabled when VERCEL_ENV is production.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {SEED_PLAN.buyers
            .filter(
              (buyer) =>
                buyer.clerkId === SEED_CLERK_IDS.buyerA ||
                buyer.clerkId === SEED_CLERK_IDS.buyerB ||
                buyer.clerkId === SEED_CLERK_IDS.buyerH,
            )
            .map((buyer) => (
              <form action={startTestSessionFromForm} key={buyer.clerkId}>
                <input type="hidden" name="clerkId" value={buyer.clerkId} />
                <Button type="submit" className="w-full">
                  Sign in as {buyer.name}
                </Button>
              </form>
            ))}
          <form action={startTestSessionFromForm}>
            <input type="hidden" name="clerkId" value={SEED_PLAN.agent.clerkId} />
            <Button type="submit" className="w-full">
              Sign in as {SEED_PLAN.agent.name}
            </Button>
          </form>
          <form action={startTestSessionFromForm}>
            <input type="hidden" name="clerkId" value={SEED_PLAN.lender.clerkId} />
            <Button type="submit" variant="outline" className="w-full">
              Sign in as {SEED_PLAN.lender.name}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
