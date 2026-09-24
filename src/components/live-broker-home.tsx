"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { api } from "../../convex/_generated/api";

export function LiveBrokerHome() {
  const router = useRouter();
  const status = useQuery(api.brokerageOnboarding.getStatus, {});
  const org = useQuery(
    api.orgs.getMine,
    status?.status === "ready" ? {} : "skip",
  );

  useEffect(() => {
    if (status?.status === "needs_onboarding") {
      router.replace("/brokerage/onboarding");
    }
    if (status?.status === "ready" && status.role === "agent") {
      router.replace("/agent");
    }
  }, [router, status]);

  if (status === undefined) {
    return <p className="text-sm text-muted-foreground">Loading broker home…</p>;
  }

  if (status.status === "needs_onboarding") {
    return (
      <p className="text-sm text-muted-foreground">Opening brokerage setup…</p>
    );
  }

  if (status.role !== "broker" && status.role !== "admin") {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in as a broker to open this home.
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="broker-home-empty">
      <h1 className="text-h1 font-semibold tracking-tight">
        {org?.name ?? "Your brokerage"}
      </h1>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        {org
          ? `${org.name} (${org.state}) has no clients in your book yet. Share invite code ${status.inviteCode ?? "—"} with agents and buyers. MLS and map integrations stay stubbed in preview.`
          : "Loading organization…"}
      </p>
    </div>
  );
}
