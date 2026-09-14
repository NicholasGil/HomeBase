"use client";

import { useQuery } from "convex/react";

import { CoachHome } from "@/components/coach-home";
import { api } from "../../convex/_generated/api";

export function LiveCoachHome() {
  const session = useQuery(api.me.getSession, {});
  const dashboard = useQuery(
    api.dashboard.getBuyerDashboard,
    session?.role === "buyer" ? {} : "skip",
  );

  if (
    session === undefined ||
    (session?.role === "buyer" && dashboard === undefined)
  ) {
    return <p className="text-sm text-muted-foreground">Loading your coach…</p>;
  }

  if (
    session === null ||
    session.role !== "buyer" ||
    dashboard === undefined ||
    dashboard === null
  ) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in as a buyer to open your personal coach.
      </p>
    );
  }

  const address = dashboard.propertyAddress;
  const scope = {
    address: address
      ? `${address.line1}, ${address.city}`
      : "No property on this file yet",
    stage: dashboard.where.label,
  };

  return <CoachHome scope={scope} buyerName={session.name} />;
}
