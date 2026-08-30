import { redirect } from "next/navigation";

import { loadFixtureIdentity } from "@/app/actions/idv";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { IdentitySecurity } from "@/components/identity-security";
import { LiveIdentitySecurity } from "@/components/live-identity-security";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default async function IdentityPage() {
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
    const loaded = await loadFixtureIdentity();
    return (
      <AppShell>
        <p className="mb-8 text-sm text-muted-foreground">
          Signed in as {session.name} · {session.role}
        </p>
        <IdentitySecurity
          denied={!loaded.ok}
          flagOn={loaded.ok ? loaded.gating.flagOn : false}
          orgState={loaded.ok ? loaded.gating.orgState : ""}
          stateAllowed={loaded.ok ? loaded.gating.stateAllowed : false}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary
        fallback={
          <p className="text-sm text-muted-foreground">
            You cannot open identity settings.
          </p>
        }
      >
        <LiveIdentitySecurity />
      </QueryErrorBoundary>
    </AppShell>
  );
}
