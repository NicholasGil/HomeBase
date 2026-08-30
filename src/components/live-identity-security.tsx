"use client";

import { useMutation, useQuery } from "convex/react";

import { IdentitySecurity } from "@/components/identity-security";
import { api } from "../../convex/_generated/api";

export function LiveIdentitySecurity() {
  const gating = useQuery(api.idv.getGating, {});
  const start = useMutation(api.idv.startSession);
  const recover = useMutation(api.idv.changeAccountRecovery);

  if (gating === undefined) {
    return <p className="text-sm text-muted-foreground">Loading identity…</p>;
  }

  return (
    <IdentitySecurity
      flagOn={gating.flagOn}
      orgState={gating.orgState}
      stateAllowed={gating.stateAllowed}
      onHighRisk={async (action) => {
        try {
          if (action === "account_recovery") {
            await recover({});
          } else {
            await start({ purpose: action });
          }
          return { ok: true };
        } catch (error: unknown) {
          return {
            ok: false,
            reason: error instanceof Error ? error.message : "FORBIDDEN",
          };
        }
      }}
    />
  );
}
