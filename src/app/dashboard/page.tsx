import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveBuyerDashboard } from "@/components/live-buyer-dashboard";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { ConciergeChat } from "@/components/concierge-chat";
import { FixtureVault } from "@/components/document-vault";
import { ContractExplainer } from "@/components/contract-explainer";
import { FixtureOfferCenter } from "@/components/offer-center";
import { FixtureTourBuilder } from "@/components/tour-builder";
import { loadFixtureExplainer } from "@/app/actions/explainer";
import { loadFixtureOffers } from "@/app/actions/offers";
import { loadFixtureTours } from "@/app/actions/tours";
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
    if (session.role === "vendor") {
      redirect("/vault");
    }
    if (session.role === "agent") {
      redirect("/agent");
    }
    const tours = await loadFixtureTours();
    const offers = await loadFixtureOffers();
    const explainer = await loadFixtureExplainer();
    return (
      <AppShell>
        <div className="space-y-10">
          <BuyerDashboardViewPanel
            view={seedDashboardForBuyer(session.clerkId)}
            buyerName={session.name}
            eyebrow="Fixture session · not Clerk"
          />
          <FixtureTourBuilder
            tours={tours.tours.ok ? tours.tours.tours : []}
          />
          <FixtureOfferCenter
            denied={!offers.ok}
            center={offers.ok ? offers.center : null}
          />
          <ContractExplainer
            denied={!explainer.sections.ok}
            sections={explainer.sections.ok ? explainer.sections.sections : []}
            thread={explainer.thread}
          />
          <FixtureVault />
          <ConciergeChat />
        </div>
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
