import { redirect } from "next/navigation";

import { getFixtureBrokerageRecord } from "@/app/actions/brokerage-onboarding";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveBrokerHome } from "@/components/live-broker-home";
import { RoleHome } from "@/components/role-home";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default async function BrokerPage() {
  if (mustFailClosed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  const session = await getTestSession();
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
    if (session?.role === "onboarding_agent") {
      const record = await getFixtureBrokerageRecord();
      if (record === null || record.clerkId !== session.clerkId) {
        redirect("/brokerage/onboarding");
      }
      if (record.role !== "broker") {
        redirect("/agent");
      }
      return (
        <AppShell>
          <div className="space-y-3" data-testid="broker-home-empty">
            <h1 className="text-h1 font-semibold tracking-tight">
              {record.orgName}
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Your brokerage is live in this fixture session. No clients are
              assigned yet — invite agents and buyers with code{" "}
              <span className="font-mono">{record.inviteCode}</span>.
            </p>
          </div>
        </AppShell>
      );
    }
    return <RoleHome role="broker" phase="P4" />;
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="Broker home did not load.">
        <LiveBrokerHome />
      </QueryErrorBoundary>
    </AppShell>
  );
}
