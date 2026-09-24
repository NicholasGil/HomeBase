import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { CoachHome } from "@/components/coach-home";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveCoachHome } from "@/components/live-coach-home";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { coachScopeForFixtureBuyer } from "@/lib/coach-fixture-scope";
import { conciergeAvailability } from "@/lib/concierge-availability";
import type { TestBuyerSession } from "@/lib/test-session";

export const dynamic = "force-dynamic";

function conciergeScopeFor(session: TestBuyerSession) {
  return coachScopeForFixtureBuyer(session);
}

export default async function CoachPage() {
  if (mustFailClosed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  const session = await getTestSession();
  const coachAvailability = conciergeAvailability(session, process.env);
  const mode = dashboardRenderMode(process.env, session);

  if (mode === "unavailable") {
    throw new ProductionAuthMisconfiguredError();
  }

  if (mode === "login") {
    return (
      <AppShell>
        <FixtureLoginPrompt />
      </AppShell>
    );
  }

  if (mode === "fixture") {
    if (session === null) {
      redirect("/test-login");
    }
    if (session.role === "vendor") {
      redirect("/vendor");
    }
    if (session.role === "agent") {
      redirect("/agent");
    }
    if (session.role !== "buyer") {
      throw new Error("fixture mode requires a buyer session");
    }
    return (
      <AppShell>
        <CoachHome
          scope={conciergeScopeFor(session)}
          buyerName={session.name}
          eyebrow="Fixture session · not Clerk"
          availability={coachAvailability}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="Your coach did not load.">
        <LiveCoachHome availability={coachAvailability} />
      </QueryErrorBoundary>
    </AppShell>
  );
}
