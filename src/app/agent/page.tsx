import { redirect } from "next/navigation";

import { getFixtureBrokerageRecord } from "@/app/actions/brokerage-onboarding";
import { getTestSession } from "@/app/actions/test-session";
import { homeActionFor } from "@/components/access-denied-card";
import {
  AgentCommandCenterView,
  CommandCenterDenied,
} from "@/components/agent-command-center";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveAgentCommandCenter } from "@/components/live-agent-command-center";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import {
  loadFixtureCommandCenterForViewer,
  loadSeedCommandCenterForViewer,
} from "@/lib/command-center-access";
import { navRoleFromTestSession } from "@/lib/test-session";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
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
    if (session === null) {
      redirect("/test-login");
    }
    if (session.role === "onboarding_agent") {
      const record = await getFixtureBrokerageRecord();
      if (record === null || record.clerkId !== session.clerkId) {
        redirect("/brokerage/onboarding");
      }
      if (record.role === "broker") {
        redirect("/broker");
      }
      const empty = loadFixtureCommandCenterForViewer(session, record);
      if (empty === null) {
        redirect("/brokerage/onboarding");
      }
      return (
        <AppShell>
          <AgentCommandCenterView
            view={empty.view}
            agentName={session.name}
            orgName={empty.orgName}
            inviteCode={record.inviteCode}
            eyebrow={`${empty.orgName} · fixture session`}
          />
        </AppShell>
      );
    }
    const loaded = loadSeedCommandCenterForViewer(session);
    if (!loaded.ok) {
      return (
        <AppShell>
          <CommandCenterDenied
            action={homeActionFor(navRoleFromTestSession(session))}
          />
        </AppShell>
      );
    }
    return (
      <AppShell>
        <AgentCommandCenterView
          view={loaded.view}
          agentName={session?.role === "agent" ? session.name : undefined}
          eyebrow="Fixture session · not Clerk"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="The command center did not load.">
        <LiveAgentCommandCenter />
      </QueryErrorBoundary>
    </AppShell>
  );
}
