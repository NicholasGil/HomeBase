import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { AppShell } from "@/components/app-shell";
import { LiveBuyerDashboard } from "@/components/live-buyer-dashboard";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { seedDashboardForBuyerA } from "@/lib/seed-dashboard";
import { SEED_PLAN } from "../../../convex/seedPlan";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const mode = dashboardRenderMode();

  if (mode === "unavailable") {
    throw new ProductionAuthMisconfiguredError();
  }

  if (mode === "seed") {
    const buyer = SEED_PLAN.buyers.find((row) => row.clerkId === "clerk_buyer_a");
    return (
      <AppShell>
        <BuyerDashboardViewPanel
          view={seedDashboardForBuyerA()}
          buyerName={buyer?.name}
          eyebrow="Local seed preview · Clerk is not configured"
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
