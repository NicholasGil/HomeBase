"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { api } from "../../convex/_generated/api";

const ROLE_HOME = {
  buyer: "/dashboard",
  agent: "/agent",
  broker: "/broker",
  admin: "/admin",
  vendor: "/vendor",
} as const;

export function RoleRouter() {
  const session = useQuery(api.me.getSession, {});
  const router = useRouter();

  useEffect(() => {
    if (session === undefined) {
      return;
    }
    router.replace(ROLE_HOME[session.role]);
  }, [router, session]);

  return <p className="text-sm text-muted-foreground">Routing by role…</p>;
}
