import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { AppShell } from "@/components/app-shell";
import { LiveBuyerDashboard } from "@/components/live-buyer-dashboard";
import { isAuthConfigured } from "@/lib/auth-config";
import { seedDashboardForBuyerA } from "@/lib/seed-dashboard";
import { SEED_PLAN } from "../../../convex/seedPlan";

export default function DashboardPage() {
  if (!isAuthConfigured()) {
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
      <LiveBuyerDashboard />
    </AppShell>
  );
}
