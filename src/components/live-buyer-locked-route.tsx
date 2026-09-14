"use client";

import { useQuery } from "convex/react";

import { BuyerLockedRouteGate } from "@/components/buyer-locked-upsell";
import {
  buyerLockedUpsell,
  type BuyerLockedArea,
} from "@/lib/buyer-shell";
import { api } from "../../convex/_generated/api";

export function LiveBuyerLockedRoute({
  area,
  children,
}: {
  area: BuyerLockedArea;
  children: React.ReactNode;
}) {
  const session = useQuery(api.me.getSession, {});

  if (session === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (session !== null && session.role === "buyer") {
    return <BuyerLockedRouteGate upsell={buyerLockedUpsell(area)} />;
  }

  return children;
}
