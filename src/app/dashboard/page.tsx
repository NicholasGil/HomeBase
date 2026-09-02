import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveBuyerDashboard } from "@/components/live-buyer-dashboard";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { FixtureVault } from "@/components/document-vault";
import { ContractExplainer } from "@/components/contract-explainer";
import { FixtureOfferCenter } from "@/components/offer-center";
import { FixtureTourBuilder } from "@/components/tour-builder";
import { FixtureVendorDirectory } from "@/components/fixture-vendor-directory";
import { loadFixtureExplainer } from "@/app/actions/explainer";
import { loadFixtureOffers } from "@/app/actions/offers";
import { loadFixtureTours } from "@/app/actions/tours";
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
  Each fixture region loads its own data inside its own error boundary, so a
  failed loader degrades that one section to a Retry card instead of taking
  the whole page down. Region order is the DOM order the specs read. The
  concierge is not a region: AppShell mounts it globally as a FAB + sheet.
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

async function FixtureToursRegion({ notice }: { notice?: string }) {
  const tours = await loadFixtureTours();
  return (
    <FixtureTourBuilder
      tours={tours.tours.ok ? tours.tours.tours : []}
      notice={notice}
      returnTo="/dashboard"
    />
  );
}

async function FixtureOffersRegion({ gate }: { gate?: string }) {
  const offers = await loadFixtureOffers();
  return (
    <FixtureOfferCenter
      denied={!offers.ok}
      center={offers.ok ? offers.center : null}
      gateFromSubmit={gate}
    />
  );
}

async function FixtureExplainerRegion() {
  const explainer = await loadFixtureExplainer();
  return (
    <ContractExplainer
      denied={!explainer.sections.ok}
      sections={explainer.sections.ok ? explainer.sections.sections : []}
      thread={explainer.thread}
    />
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; gate?: string }>;
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
    return (
      <AppShell>
        <div className={tripStackClassName}>
          <QueryErrorBoundary message="Your file did not load.">
            <BuyerDashboardViewPanel
              view={seedDashboardForBuyer(session.clerkId)}
              buyerName={session.name}
              eyebrow="Fixture session · not Clerk"
            />
          </QueryErrorBoundary>
          {fixtureBuyerIsClosed(session) ? (
            <QueryErrorBoundary message="The homeownership hub did not load.">
              <FixtureHubRegion session={session} />
            </QueryErrorBoundary>
          ) : null}
          <QueryErrorBoundary message="Tours did not load.">
            <FixtureToursRegion notice={params.notice} />
          </QueryErrorBoundary>
          <QueryErrorBoundary message="The offer center did not load.">
            <FixtureOffersRegion gate={params.gate} />
          </QueryErrorBoundary>
          <QueryErrorBoundary message="The contract explainer did not load.">
            <FixtureExplainerRegion />
          </QueryErrorBoundary>
          <QueryErrorBoundary message="The vendor directory did not load.">
            <FixtureVendorDirectory />
          </QueryErrorBoundary>
          <QueryErrorBoundary message="The document vault did not load.">
            <FixtureVault />
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
