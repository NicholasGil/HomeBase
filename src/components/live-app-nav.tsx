"use client";

import { useConvexAuth, useQuery } from "convex/react";

import { AppNavLinks } from "@/components/app-nav";
import { navLinksFor, type AppNavRole } from "@/lib/app-nav";
import { api } from "../../convex/_generated/api";

const NAV_ROLES = [
  "buyer",
  "agent",
  "broker",
  "admin",
  "vendor",
] as const satisfies readonly AppNavRole[];

function isAppNavRole(value: string): value is Exclude<AppNavRole, "guest"> {
  return (NAV_ROLES as readonly string[]).includes(value);
}

export function LiveAppNav() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const session = useQuery(api.me.getSession, isAuthenticated ? {} : "skip");
  const dashboard = useQuery(
    api.dashboard.getBuyerDashboard,
    isAuthenticated && session?.role === "buyer" ? {} : "skip",
  );

  if (isLoading || (isAuthenticated && session === undefined)) {
    return <div data-testid="app-nav" data-nav-role="guest" />;
  }

  if (!isAuthenticated || session === undefined || !isAppNavRole(session.role)) {
    return <AppNavLinks links={[]} role="guest" />;
  }

  const buyerClosed =
    session.role === "buyer" && dashboard?.where.status === "closed";
  const hubHref =
    buyerClosed && dashboard
      ? `/homeownership/${dashboard.transactionId}`
      : undefined;

  return (
    <AppNavLinks
      links={navLinksFor({
        role: session.role,
        buyerClosed,
        hubHref,
      })}
      role={session.role}
      viewerName={session.name}
    />
  );
}
