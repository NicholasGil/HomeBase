import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { BuyerLockedRouteGate } from "@/components/buyer-locked-upsell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveBuyerDashboard } from "@/components/live-buyer-dashboard";
import { LiveBuyerLockedRoute } from "@/components/live-buyer-locked-route";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { buyerLockedUpsell } from "@/lib/buyer-shell";

export const dynamic = "force-dynamic";

/*
  Buyer pipeline (journey map, task rail, vendor directory) is a locked
  upsell in the coach-first shell. Ten-second status for an active file lives
  on /coach; this route shows locked copy until the full OS is enabled.
*/

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
      redirect("/vendor");
    }
    if (session.role === "agent") {
      redirect("/agent");
    }
    if (session.role !== "buyer") {
      throw new Error("fixture mode requires a buyer session");
    }
    return (
      <AppShell>
        <BuyerLockedRouteGate upsell={buyerLockedUpsell("pipeline")} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="Your dashboard did not load.">
        <LiveBuyerLockedRoute area="pipeline">
          <LiveBuyerDashboard />
        </LiveBuyerLockedRoute>
      </QueryErrorBoundary>
    </AppShell>
  );
}
