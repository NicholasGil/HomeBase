import { SEED_PLAN } from "../../convex/seedPlan";
import type { TestSession } from "@/lib/test-session";

export type FixtureProfileContact = {
  email: string;
  phone: string;
};

export function fixtureContactForSession(
  session: TestSession,
): FixtureProfileContact | null {
  if (session.role === "agent") {
    return {
      email: SEED_PLAN.agent.email,
      phone: SEED_PLAN.agent.phone,
    };
  }
  if (session.role === "vendor") {
    return {
      email: SEED_PLAN.lender.email,
      phone: SEED_PLAN.lender.phone,
    };
  }
  const buyer = SEED_PLAN.buyers.find((row) => row.clerkId === session.clerkId);
  if (buyer === undefined) {
    return null;
  }
  return {
    email: buyer.email,
    phone: buyer.phone,
  };
}
