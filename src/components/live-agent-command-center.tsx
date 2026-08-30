"use client";

import { useQuery } from "convex/react";

import {
  AgentCommandCenterView,
  CommandCenterDenied,
} from "@/components/agent-command-center";
import { api } from "../../convex/_generated/api";

export function LiveAgentCommandCenter({ agentName }: { agentName?: string }) {
  const view = useQuery(api.commandCenter.getMine, {});

  if (view === undefined) {
    return <p className="text-sm text-muted-foreground">Loading the book…</p>;
  }

  if (view === null) {
    return <CommandCenterDenied />;
  }

  return <AgentCommandCenterView view={view} agentName={agentName} />;
}
