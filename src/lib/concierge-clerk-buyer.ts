import { fetchQuery } from "convex/nextjs";

import { api } from "../../convex/_generated/api";
import { isConvexConfigured } from "@/lib/auth-config";
import { coachScopeForBuyerDashboard } from "@/lib/coach-scope";
import { isCoachDiscoveryEmptyScope } from "@/lib/coach-first-session";

export type ClerkBuyerConciergeContext =
  | {
      ok: true;
      discoveryEmpty: boolean;
    }
  | {
      ok: false;
      reason: "UNAUTHENTICATED" | "FORBIDDEN";
    };

export async function clerkBuyerConciergeContext(): Promise<
  ClerkBuyerConciergeContext | null
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

  try {
    const session = await fetchQuery(api.me.getSession, {}, { token });
    if (session.role !== "buyer") {
      return { ok: false, reason: "FORBIDDEN" };
    }

    const dashboard = await fetchQuery(
      api.dashboard.getBuyerDashboard,
      {},
      { token },
    );
    const discoveryEmpty = isCoachDiscoveryEmptyScope(
      coachScopeForBuyerDashboard(dashboard),
    );
    return { ok: true, discoveryEmpty };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("UNAUTHENTICATED")) {
      return { ok: false, reason: "UNAUTHENTICATED" };
    }
    return { ok: false, reason: "FORBIDDEN" };
  }
}
