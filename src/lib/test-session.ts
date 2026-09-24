import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { isProductionDeploy, type AuthEnv } from "@/lib/auth-config";
import type { AppNavRole } from "@/lib/app-nav";
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
  /** Fixture-only: Path B–style coach with no property on file yet. */
  emptyCoachFile?: boolean;
};

const EMPTY_COACH_FILE_MARKER = "empty";

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

export type TestOnboardingAgentSession = {
  clerkId: typeof SEED_CLERK_IDS.onboardingAgent;
  name: string;
  role: "onboarding_agent";
};

export type TestSession =
  | TestBuyerSession
  | TestVendorSession
  | TestAgentSession
  | TestOnboardingAgentSession;

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

export function isTestOnboardingAgentClerkId(
  value: string,
): value is typeof SEED_CLERK_IDS.onboardingAgent {
  return value === SEED_CLERK_IDS.onboardingAgent;
}

export function encodeTestSessionCookie(session: TestSession): string {
  if (session.role === "buyer" && session.emptyCoachFile) {
    return `${session.clerkId}~${EMPTY_COACH_FILE_MARKER}`;
  }
  return session.clerkId;
}

export function startTestSessionDecision(
  clerkId: string,
  env: AuthEnv = process.env,
  options?: { emptyCoachFile?: boolean },
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
  if (isTestOnboardingAgentClerkId(clerkId)) {
    return {
      ok: true,
      session: {
        clerkId,
        name: "Taylor Brooks",
        role: "onboarding_agent",
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
      emptyCoachFile: options?.emptyCoachFile === true,
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
  const parts = value.split("~");
  const clerkId = parts[0];
  const marker = parts[1];
  if (clerkId === undefined || clerkId.length === 0) {
    return null;
  }
  const emptyCoachFile = marker === EMPTY_COACH_FILE_MARKER;
  const started = startTestSessionDecision(clerkId, env, { emptyCoachFile });
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

export function navRoleFromTestSession(
  session: TestSession | null | undefined,
): AppNavRole | undefined {
  if (session === null || session === undefined) {
    return undefined;
  }
  if (session.role === "onboarding_agent") {
    return undefined;
  }
  return session.role;
}

export function fixtureHomePath(session: TestSession) {
  if (session.role === "vendor") {
    return "/vendor";
  }
  if (session.role === "onboarding_agent") {
    return "/brokerage/onboarding";
  }
  if (session.role === "agent") {
    return "/agent";
  }
  return "/coach";
}
