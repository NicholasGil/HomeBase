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
  const session = useQuery(api.me.getSession, provisioned ? {} : "skip");
  const router = useRouter();

  useEffect(() => {
    if (!provisioned || session === undefined) {
      return;
    }
    router.replace(ROLE_HOME[session.role]);
  }, [provisioned, router, session]);

  return <p className="text-sm text-muted-foreground">Routing by role…</p>;
}
