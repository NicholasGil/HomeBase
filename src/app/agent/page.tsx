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
import { loadSeedCommandCenterForViewer } from "@/lib/command-center-access";

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
    const loaded = loadSeedCommandCenterForViewer(session);
    if (!loaded.ok) {
      return (
        <AppShell>
          <CommandCenterDenied action={homeActionFor(session?.role)} />
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
