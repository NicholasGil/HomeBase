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
  const book = useQuery(
    api.commandCenter.getBook,
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

  if (book === undefined) {
    return <p className="text-sm text-muted-foreground">Loading the book…</p>;
  }

  return (
    <AgentCommandCenterView
      view={book.view}
      agentName={agentName ?? status.name}
      orgName={org?.name}
      bookScope={book.scope}
      inviteCode={
        book.view.roster.length === 0 ? status.inviteCode : null
      }
    />
  );
}
