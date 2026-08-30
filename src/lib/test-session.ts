import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { isProductionDeploy, type AuthEnv } from "@/lib/auth-config";
import {
  clerkIdForSeedTransaction,
  seedDashboardForBuyer,
  seedDashboardForClerkId,
  type TestBuyerClerkId,
} from "@/lib/seed-dashboard";

export const TEST_SESSION_COOKIE = "hb_test_identity";

export const SEED_TRANSACTION_IDS = {
  [SEED_CLERK_IDS.buyerA]: "seed:buyer-a",
  [SEED_CLERK_IDS.buyerB]: "seed:buyer-b",
  [SEED_CLERK_IDS.buyerH]: "seed:buyer-h",
} as const;

export type { TestBuyerClerkId };

export type TestBuyerSession = {
  clerkId: TestBuyerClerkId;
  name: string;
  role: "buyer";
  transactionId: (typeof SEED_TRANSACTION_IDS)[TestBuyerClerkId];
};

export type TestVendorSession = {
  clerkId: typeof SEED_CLERK_IDS.lender;
  name: string;
  role: "vendor";
};

export type TestAgentSession = {
  clerkId: typeof SEED_CLERK_IDS.agent;
  name: string;
  role: "agent";
};

export type TestSession =
  | TestBuyerSession
  | TestVendorSession
  | TestAgentSession;

export function isTestBuyerClerkId(value: string): value is TestBuyerClerkId {
  return (
    value === SEED_CLERK_IDS.buyerA ||
    value === SEED_CLERK_IDS.buyerB ||
    value === SEED_CLERK_IDS.buyerH
  );
}

export function isTestLenderClerkId(
  value: string,
): value is typeof SEED_CLERK_IDS.lender {
  return value === SEED_CLERK_IDS.lender;
}

export function isTestAgentClerkId(
  value: string,
): value is typeof SEED_CLERK_IDS.agent {
  return value === SEED_CLERK_IDS.agent;
}

export function startTestSessionDecision(
  clerkId: string,
  env: AuthEnv = process.env,
): { ok: true; session: TestSession } | { ok: false; reason: "FORBIDDEN" } {
  if (isProductionDeploy(env)) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (isTestLenderClerkId(clerkId)) {
    return {
      ok: true,
      session: {
        clerkId,
        name: SEED_PLAN.lender.name,
        role: "vendor",
      },
    };
  }
  if (isTestAgentClerkId(clerkId)) {
    return {
      ok: true,
      session: {
        clerkId,
        name: SEED_PLAN.agent.name,
        role: "agent",
      },
    };
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
  if (session.role === "agent") {
    const clerkId = clerkIdForSeedTransaction(transactionId);
    if (clerkId === null) {
      return { ok: false, reason: "FORBIDDEN" };
    }
    return { ok: true, view: seedDashboardForClerkId(clerkId) };
  }
  if (session.role !== "buyer" || session.transactionId !== transactionId) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return { ok: true, view: seedDashboardForBuyer(session.clerkId) };
}

export function fixtureHomePath(session: TestSession) {
  if (session.role === "vendor") {
    return "/vendor";
  }
  if (session.role === "agent") {
    return "/agent";
  }
  return "/dashboard";
}
