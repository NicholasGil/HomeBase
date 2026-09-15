import { fetchQuery } from "convex/nextjs";

import type { ConciergeFact } from "../../lib/llm/types";
import {
  discoveryEmptyConciergeFacts,
  isDiscoveryEmptyConciergeFacts,
} from "../../lib/llm/discoveryEmptyFacts";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { isConvexConfigured } from "@/lib/auth-config";
import { coachScopeForBuyerDashboard } from "@/lib/coach-scope";
import { isCoachDiscoveryEmptyScope } from "@/lib/coach-first-session";

export type ClerkBuyerConciergeFactsResult =
  | { ok: true; facts: ConciergeFact[] }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" };

function convexFailureReason(
  error: unknown,
): "UNAUTHENTICATED" | "FORBIDDEN" {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("UNAUTHENTICATED")) {
    return "UNAUTHENTICATED";
  }
  return "FORBIDDEN";
}

/**
 * Clerk + Convex: buyer membership and concierge facts are resolved on the server.
 * Discovery-empty scope comes from dashboard / coach scope — never from the client.
 */
export async function clerkBuyerConciergeFacts(): Promise<
  ClerkBuyerConciergeFactsResult | null
> {
  const { auth } = await import("@clerk/nextjs/server");
  const authState = await auth();
  if (authState.userId === null) {
    return null;
  }

  if (!isConvexConfigured()) {
    return { ok: false, reason: "FORBIDDEN" };
  }

  const token = await authState.getToken({ template: "convex" });
  if (token === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  const queryOpts = { token };

  try {
    const session = await fetchQuery(api.me.getSession, {}, queryOpts);
    if (session.role !== "buyer") {
      return { ok: false, reason: "FORBIDDEN" };
    }

    const dashboard = await fetchQuery(
      api.dashboard.getBuyerDashboard,
      {},
      queryOpts,
    );
    const discoveryEmpty = isCoachDiscoveryEmptyScope(
      coachScopeForBuyerDashboard(dashboard),
    );

    if (discoveryEmpty || dashboard === null) {
      return { ok: true, facts: discoveryEmptyConciergeFacts() };
    }

    const facts = await fetchQuery(
      api.concierge.gatherContext,
      {
        transactionId: dashboard.transactionId as Id<"transactions">,
      },
      queryOpts,
    );
    return { ok: true, facts };
  } catch (error) {
    return { ok: false, reason: convexFailureReason(error) };
  }
}

/** @deprecated Use clerkBuyerConciergeFacts */
export async function clerkBuyerConciergeContext() {
  const result = await clerkBuyerConciergeFacts();
  if (result === null) {
    return null;
  }
  if (!result.ok) {
    return result;
  }
  const discoveryEmpty = isDiscoveryEmptyConciergeFacts(result.facts);
  return { ok: true as const, discoveryEmpty };
}
