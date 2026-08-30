import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import {
  HomeownershipHubDenied,
  HomeownershipHubView,
} from "@/components/homeownership-hub";
import { LiveHomeownershipHub } from "@/components/live-homeownership-hub";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  loadFixtureHub,
  reengageFixtureVendorFromForm,
} from "@/app/actions/homeownership";
import { getTestSession } from "@/app/actions/test-session";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default async function HomeownershipHubPage({
  params,
}: PageProps<"/homeownership/[transactionId]">) {
  const { transactionId } = await params;

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
    const loaded = await loadFixtureHub(transactionId);
    if (!loaded.ok) {
      return (
        <AppShell>
          <HomeownershipHubDenied />
        </AppShell>
      );
    }
    return (
      <AppShell>
        <p className="mb-8 text-sm text-muted-foreground">
          Signed in as {session?.name} · {session?.role}
        </p>
        <HomeownershipHubView
          view={loaded.view}
          reengageAction={reengageFixtureVendorFromForm}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary fallback={<HomeownershipHubDenied />}>
        <LiveHomeownershipHub transactionId={transactionId} />
      </QueryErrorBoundary>
    </AppShell>
  );
}
