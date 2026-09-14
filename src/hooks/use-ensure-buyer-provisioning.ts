"use client";

import { useMutation } from "convex/react";
import { useEffect, useState } from "react";

import { api } from "../../convex/_generated/api";

/**
 * Idempotent Convex buyer row for Clerk identities. Ignores FORBIDDEN when the
 * signed-in user is already an agent, vendor, or broker.
 */
export function useEnsureBuyerProvisioning() {
  const ensureBuyer = useMutation(api.users.ensureBuyer);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ensureBuyer({})
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ensureBuyer]);

  return ready;
}
