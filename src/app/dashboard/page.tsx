import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import { ActionNotice } from "@/components/action-notice";
import { AppShell } from "@/components/app-shell";
import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { DashboardSummaryCards } from "@/components/dashboard-summary-cards";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveBuyerDashboard } from "@/components/live-buyer-dashboard";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { FixtureVendorDirectory } from "@/components/fixture-vendor-directory";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { HomeownershipHubView } from "@/components/homeownership-hub";
import {
  loadFixtureHub,
  reengageFixtureVendorFromForm,
} from "@/app/actions/homeownership";
import { seedDashboardForBuyer } from "@/lib/seed-dashboard";
import { fixtureBuyerIsClosed } from "@/lib/homeownership-access";
import type { TestBuyerSession } from "@/lib/test-session";
import { tripStackClassName } from "@/lib/trip-ui";

export const dynamic = "force-dynamic";

/*
  The dashboard is the ten-second fold plus pointers. Tours, offers, the
  explainer, and the vault each own a route; the dashboard links to them
  instead of inlining their builders. The vendor directory stays because it
  is stage-triggered and has no route of its own. Each region loads inside
  its own error boundary so one failed loader degrades to a Retry card.
  Region order is the DOM order the specs read. The concierge is not a
  region: AppShell mounts it globally as a FAB + sheet.
*/

async function FixtureHubRegion({ session }: { session: TestBuyerSession }) {
  const hub = await loadFixtureHub(session.transactionId);
  if (!hub.ok) {
    return null;
  }
  return (
    <HomeownershipHubView
      view={hub.view}
      reengageAction={reengageFixtureVendorFromForm}
    />
  );
}

export default async function DashboardPage({
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
      throw new Error("fixture mode requires a test session");
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
    const params = await searchParams;
    const view = seedDashboardForBuyer(session.clerkId);
    return (
      <AppShell>
        <div className={tripStackClassName}>
          <QueryErrorBoundary message="Your file did not load.">
            <BuyerDashboardViewPanel
              view={view}
              buyerName={session.name}
              eyebrow="Fixture session · not Clerk"
              detail="summary"
            />
          </QueryErrorBoundary>
          {fixtureBuyerIsClosed(session) ? (
            <QueryErrorBoundary message="The homeownership hub did not load.">
              <FixtureHubRegion session={session} />
            </QueryErrorBoundary>
          ) : null}
          <DashboardSummaryCards view={view} />
          <QueryErrorBoundary message="The vendor directory did not load.">
            <div className="space-y-4">
              <ActionNotice notice={params.notice} />
              <FixtureVendorDirectory />
            </div>
          </QueryErrorBoundary>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="Your dashboard did not load.">
        <LiveBuyerDashboard />
      </QueryErrorBoundary>
    </AppShell>
  );
}
