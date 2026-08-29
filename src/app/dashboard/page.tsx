import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveBuyerDashboard } from "@/components/live-buyer-dashboard";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { seedDashboardForBuyer } from "@/lib/seed-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
      throw new Error("fixture mode requires a test session");
    }
    return (
      <AppShell>
        <BuyerDashboardViewPanel
          view={seedDashboardForBuyer(session.clerkId)}
          buyerName={session.name}
          eyebrow="Fixture session · not Clerk"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary
        fallback={
          <p className="text-sm text-muted-foreground">
            You cannot open this dashboard.
          </p>
        }
      >
        <LiveBuyerDashboard />
      </QueryErrorBoundary>
    </AppShell>
  );
}
