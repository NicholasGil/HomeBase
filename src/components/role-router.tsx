"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useEnsureBuyerProvisioning } from "@/hooks/use-ensure-buyer-provisioning";
import { api } from "../../convex/_generated/api";

const ROLE_HOME = {
  buyer: "/coach",
  agent: "/agent",
  broker: "/broker",
  admin: "/admin",
  vendor: "/vendor",
} as const;

export function RoleRouter() {
  const provisioned = useEnsureBuyerProvisioning();
  const account = useQuery(
    api.brokerageOnboarding.getStatus,
    provisioned ? {} : "skip",
  );
  const router = useRouter();

  useEffect(() => {
    if (!provisioned || account === undefined) {
      return;
    }
    if (account.status === "needs_onboarding") {
      router.replace("/brokerage/onboarding");
      return;
    }
    if (account.status === "ready" && account.role in ROLE_HOME) {
      router.replace(ROLE_HOME[account.role as keyof typeof ROLE_HOME]);
    }
  }, [account, provisioned, router]);

  return <p className="text-sm text-muted-foreground">Routing by role…</p>;
}
