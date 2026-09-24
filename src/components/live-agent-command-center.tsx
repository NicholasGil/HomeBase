"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  AgentCommandCenterView,
  CommandCenterDenied,
} from "@/components/agent-command-center";
import { api } from "../../convex/_generated/api";

export function LiveAgentCommandCenter({ agentName }: { agentName?: string }) {
  const router = useRouter();
  const status = useQuery(api.brokerageOnboarding.getStatus, {});
  const org = useQuery(
    api.orgs.getMine,
    status?.status === "ready" ? {} : "skip",
  );
  const view = useQuery(
    api.commandCenter.getMine,
    status?.status === "ready" && status.role === "agent" ? {} : "skip",
  );

  useEffect(() => {
    if (status?.status === "needs_onboarding") {
      router.replace("/brokerage/onboarding");
    }
    if (status?.status === "ready" && status.role === "broker") {
      router.replace("/broker");
    }
  }, [router, status]);

  if (status === undefined) {
    return <p className="text-sm text-muted-foreground">Loading the book…</p>;
  }

  if (status.status === "needs_onboarding") {
    return (
      <p className="text-sm text-muted-foreground">Opening brokerage setup…</p>
    );
  }

  if (status.role !== "agent") {
    return <CommandCenterDenied />;
  }

  if (view === undefined) {
    return <p className="text-sm text-muted-foreground">Loading the book…</p>;
  }

  if (view === null) {
    return <CommandCenterDenied />;
  }

  return (
    <AgentCommandCenterView
      view={view}
      agentName={agentName ?? status.name}
      orgName={org?.name}
      inviteCode={status.inviteCode}
    />
  );
}
