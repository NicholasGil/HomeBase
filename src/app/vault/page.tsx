import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureVault } from "@/components/document-vault";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveDocumentVault } from "@/components/live-document-vault";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { RouteHeader } from "@/components/route-header";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default async function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
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
    const params = await searchParams;
    return (
      <AppShell>
        <RouteHeader
          title="Document vault"
          caption={`Signed in as ${session.name} · ${session.role}`}
        />
        <QueryErrorBoundary message="The document vault did not load.">
          <FixtureVault notice={params.notice} />
        </QueryErrorBoundary>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="The document vault did not load.">
        <LiveDocumentVault />
      </QueryErrorBoundary>
    </AppShell>
  );
}
