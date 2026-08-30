import { IDV_NOT_ENABLED, idvGating } from "../../convex/lib/idv";
import { SEED_PLAN } from "../../convex/seedPlan";
import { getFeatureFlags } from "@/lib/flags";
import type { TestSession } from "@/lib/test-session";

export type IdvHighRiskAction =
  | "financial_document"
  | "designated_document"
  | "account_recovery";

export function loadFixtureIdv(session: TestSession | null):
  | {
      ok: true;
      gating: ReturnType<typeof idvGating>;
    }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  if (session === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (session.role === "vendor") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return {
    ok: true,
    gating: idvGating({
      flags: getFeatureFlags(),
      orgState: SEED_PLAN.org.state,
    }),
  };
}

export function attemptFixtureHighRisk(input: {
  session: TestSession | null;
  action: IdvHighRiskAction;
}):
  | { ok: true }
  | {
      ok: false;
      reason: "UNAUTHENTICATED" | "FORBIDDEN" | typeof IDV_NOT_ENABLED;
    } {
  if (input.session === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (input.session.role === "vendor") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  const gating = idvGating({
    flags: getFeatureFlags(),
    orgState: SEED_PLAN.org.state,
  });
  if (!gating.allowed) {
    return { ok: false, reason: IDV_NOT_ENABLED };
  }
  return { ok: false, reason: IDV_NOT_ENABLED };
}
