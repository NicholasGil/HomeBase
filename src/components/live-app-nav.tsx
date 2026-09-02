"use client";

import { useConvexAuth, useQuery } from "convex/react";

import { AppNavLinks } from "@/components/app-nav";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { navLinksFor, type AppNavLink, type AppNavRole } from "@/lib/app-nav";
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

type LiveNavState =
  | { status: "loading" }
  | { status: "guest" }
  | {
      status: "ready";
      role: Exclude<AppNavRole, "guest">;
      name: string;
      links: AppNavLink[];
    };

function useLiveNavState(): LiveNavState {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const session = useQuery(api.me.getSession, isAuthenticated ? {} : "skip");
  const dashboard = useQuery(
    api.dashboard.getBuyerDashboard,
    isAuthenticated && session?.role === "buyer" ? {} : "skip",
  );

  if (isLoading || (isAuthenticated && session === undefined)) {
    return { status: "loading" };
  }

  if (!isAuthenticated || session === undefined || !isAppNavRole(session.role)) {
    return { status: "guest" };
  }

  const buyerClosed =
    session.role === "buyer" && dashboard?.where.status === "closed";
  const hubHref =
    buyerClosed && dashboard
      ? `/homeownership/${dashboard.transactionId}`
      : undefined;

  return {
    status: "ready",
    role: session.role,
    name: session.name,
    links: navLinksFor({ role: session.role, buyerClosed, hubHref }),
  };
}

export function LiveAppNav() {
  const state = useLiveNavState();

  if (state.status === "loading") {
    return <div data-testid="app-nav" data-nav-role="guest" />;
  }

  if (state.status === "guest") {
    return <AppNavLinks links={[]} role="guest" />;
  }

  return (
    <AppNavLinks links={state.links} role={state.role} viewerName={state.name} />
  );
}

export function LiveMobileTabBar() {
  const state = useLiveNavState();

  if (state.status !== "ready") {
    return null;
  }

  return <MobileTabBar links={state.links} />;
}
