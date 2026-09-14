import { redirect } from "next/navigation";

import { loadFixtureTours } from "@/app/actions/tours";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { BuyerLockedRouteGate } from "@/components/buyer-locked-upsell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveBuyerLockedRoute } from "@/components/live-buyer-locked-route";
import { LiveTourBuilder } from "@/components/live-tour-builder";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { RouteHeader } from "@/components/route-header";
import { FixtureTourBuilder } from "@/components/tour-builder";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { buyerLockedUpsell } from "@/lib/buyer-shell";

export const dynamic = "force-dynamic";

async function FixtureTours({ notice }: { notice?: string }) {
  const loaded = await loadFixtureTours();
  const denied =
    !loaded.candidates.ok && loaded.candidates.reason === "FORBIDDEN";
  return (
    <FixtureTourBuilder
      denied={denied}
      tours={loaded.tours.ok ? loaded.tours.tours : []}
      notice={notice}
      returnTo="/tours"
    />
  );
}

export default async function ToursPage({
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
    if (session.role === "buyer") {
      return (
        <AppShell>
          <RouteHeader
            title="Tours"
            caption={`Signed in as ${session.name} · buyer`}
          />
          <BuyerLockedRouteGate upsell={buyerLockedUpsell("tours")} />
        </AppShell>
      );
    }
    const params = await searchParams;
    return (
      <AppShell>
        <RouteHeader
          title="Tours"
          caption={`Signed in as ${session.name} · ${session.role}`}
        />
        <QueryErrorBoundary message="Tours did not load.">
          <FixtureTours notice={params.notice} />
        </QueryErrorBoundary>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="Tours did not load.">
        <LiveBuyerLockedRoute area="tours">
          <LiveTourBuilder />
        </LiveBuyerLockedRoute>
      </QueryErrorBoundary>
    </AppShell>
  );
}
