import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { isProductionDeploy, type AuthEnv } from "@/lib/auth-config";
import {
  seedDashboardForBuyer,
  type TestBuyerClerkId,
} from "@/lib/seed-dashboard";

export const TEST_SESSION_COOKIE = "hb_test_identity";

export const SEED_TRANSACTION_IDS = {
  [SEED_CLERK_IDS.buyerA]: "seed:buyer-a",
  [SEED_CLERK_IDS.buyerB]: "seed:buyer-b",
} as const;

export type { TestBuyerClerkId };

export type TestSession = {
  clerkId: TestBuyerClerkId;
  name: string;
  role: "buyer";
  transactionId: (typeof SEED_TRANSACTION_IDS)[TestBuyerClerkId];
};

export function isTestBuyerClerkId(value: string): value is TestBuyerClerkId {
  return (
    value === SEED_CLERK_IDS.buyerA || value === SEED_CLERK_IDS.buyerB
  );
}

export function startTestSessionDecision(
  clerkId: string,
  env: AuthEnv = process.env,
): { ok: true; session: TestSession } | { ok: false; reason: "FORBIDDEN" } {
  if (isProductionDeploy(env)) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (!isTestBuyerClerkId(clerkId)) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  const buyer = SEED_PLAN.buyers.find((row) => row.clerkId === clerkId);
  if (buyer === undefined) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return {
    ok: true,
    session: {
      clerkId,
      name: buyer.name,
      role: "buyer",
      transactionId: SEED_TRANSACTION_IDS[clerkId],
    },
  };
}

export function parseTestSessionCookie(
  value: string | undefined,
  env: AuthEnv = process.env,
): TestSession | null {
  if (value === undefined) {
    return null;
  }
  const started = startTestSessionDecision(value, env);
  return started.ok ? started.session : null;
}

export function loadSeedTransactionForViewer(
  session: TestSession | null,
  transactionId: string,
):
  | { ok: true; view: BuyerDashboardView }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  if (session === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (session.transactionId !== transactionId) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return { ok: true, view: seedDashboardForBuyer(session.clerkId) };
}
