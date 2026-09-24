"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AgentCommandCenterView } from "@/components/agent-command-center";
import { OrgInviteCta } from "@/components/org-invite-cta";
import { api } from "../../convex/_generated/api";

export function LiveBrokerHome() {
  const router = useRouter();
  const status = useQuery(api.brokerageOnboarding.getStatus, {});
  const org = useQuery(
    api.orgs.getMine,
    status?.status === "ready" ? {} : "skip",
  );
  const book = useQuery(
    api.commandCenter.getBook,
    status?.status === "ready" &&
      (status.role === "broker" || status.role === "admin")
      ? {}
      : "skip",
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

  if (book === undefined) {
    return <p className="text-sm text-muted-foreground">Loading the book…</p>;
  }

  if (book.view.roster.length > 0) {
    return (
      <AgentCommandCenterView
        view={book.view}
        agentName={status.name}
        orgName={org?.name}
        bookScope={book.scope}
        eyebrow={`${org?.name ?? "Brokerage"} · broker home`}
      />
    );
  }

  const inviteCode = status.inviteCode;
  return (
    <div className="space-y-4" data-testid="broker-home-empty">
      <h1 className="text-h1 font-semibold tracking-tight">
        {org?.name ?? "Your brokerage"}
      </h1>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        {org
          ? `${org.name} (${org.state}) has no clients in the book yet. Share your invite code when you add agents and buyers. MLS and map integrations stay stubbed in preview.`
          : "Loading organization…"}
      </p>
      {inviteCode ? <OrgInviteCta inviteCode={inviteCode} /> : null}
    </div>
  );
}
