import { redirect } from "next/navigation";

import { loadFixtureTours } from "@/app/actions/tours";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveTourBuilder } from "@/components/live-tour-builder";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { FixtureTourBuilder } from "@/components/tour-builder";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default async function ToursPage() {
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
    const loaded = await loadFixtureTours();
    const denied =
      !loaded.candidates.ok && loaded.candidates.reason === "FORBIDDEN";
    return (
      <AppShell>
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Tours</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Signed in as {session.name} · {session.role}
        </p>
        <FixtureTourBuilder
          denied={denied}
          tours={loaded.tours.ok ? loaded.tours.tours : []}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary
        fallback={
          <p className="text-sm text-muted-foreground">
            You cannot open tours.
          </p>
        }
      >
        <LiveTourBuilder />
      </QueryErrorBoundary>
    </AppShell>
  );
}
