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
import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { RouteHeader } from "@/components/route-header";
import { buyerLockedUpsell } from "@/lib/buyer-shell";
import { buyerFixtureOsUnlocked } from "@/lib/demo-buyer-os";
import { seedDashboardForBuyer } from "@/lib/seed-dashboard";
import { SEED_CLERK_IDS } from "../../../convex/seedPlan";

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
    if (session.role === "agent" && !buyerFixtureOsUnlocked()) {
      redirect("/agent");
    }
    if (session.role !== "buyer" && session.role !== "agent") {
      throw new Error("fixture mode requires a buyer or agent session");
    }
    if (!buyerFixtureOsUnlocked()) {
      return (
        <AppShell>
          <BuyerLockedRouteGate upsell={buyerLockedUpsell("pipeline")} />
        </AppShell>
      );
    }
    const view =
      session.role === "buyer"
        ? seedDashboardForBuyer(session.clerkId)
        : seedDashboardForBuyer(SEED_CLERK_IDS.buyerA);
    const buyerLabel =
      session.role === "buyer" ? session.name : "Alex Rivera (sample file)";
    return (
      <AppShell>
        <RouteHeader title="Pipeline" caption="Sample transaction pipeline · demo data" />
        <BuyerDashboardViewPanel view={view} buyerName={buyerLabel} />
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
