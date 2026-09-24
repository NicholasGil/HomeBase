"use client";

import { useQuery } from "convex/react";

import { CoachHome } from "@/components/coach-home";
import { useEnsureBuyerProvisioning } from "@/hooks/use-ensure-buyer-provisioning";
import { coachScopeForBuyerDashboard } from "@/lib/coach-scope";
import type { ConciergeAvailability } from "@/lib/concierge-availability";
import { api } from "../../convex/_generated/api";

export function LiveCoachHome({
  availability = "ready",
}: {
  availability?: ConciergeAvailability;
}) {
  const provisioned = useEnsureBuyerProvisioning();
  const session = useQuery(api.me.getSession, provisioned ? {} : "skip");
  const dashboard = useQuery(
    api.dashboard.getBuyerDashboard,
    provisioned && session?.role === "buyer" ? {} : "skip",
  );

  if (!provisioned || session === undefined) {
    return <p className="text-sm text-muted-foreground">Loading your coach…</p>;
  }

  if (session === null || session.role !== "buyer") {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in as a buyer to open your personal coach.
      </p>
    );
  }

  if (dashboard === undefined) {
    return <p className="text-sm text-muted-foreground">Loading your coach…</p>;
  }

  const scope = coachScopeForBuyerDashboard(dashboard);

  return (
    <CoachHome
      scope={scope}
      buyerName={session.name}
      availability={availability}
      dashboardView={dashboard}
    />
  );
}
