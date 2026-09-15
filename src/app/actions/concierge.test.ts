import { beforeEach, describe, expect, it, vi } from "vitest";

import { COACH_FIRST_SESSION_STARTERS } from "@/lib/coach-first-session";
import { SEED_CLERK_IDS } from "../../../convex/seedPlan";

const getTestSessionMock = vi.fn();
const clerkBuyerConciergeFactsMock = vi.fn();

vi.mock("@/app/actions/test-session", () => ({
  getTestSession: getTestSessionMock,
}));

vi.mock("@/lib/concierge-clerk-buyer", () => ({
  clerkBuyerConciergeFacts: clerkBuyerConciergeFactsMock,
}));

vi.mock("@/lib/auth-config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-config")>();
  return {
    ...actual,
    isClerkConfigured: () => true,
  };
});

describe("askConcierge", () => {
  beforeEach(() => {
    getTestSessionMock.mockReset();
    clerkBuyerConciergeFactsMock.mockReset();
  });

  async function ask(question: string) {
    const { askConcierge } = await import("@/app/actions/concierge");
    return askConcierge({ question });
  }

  it("returns FORBIDDEN for fixture non-buyer without calling Clerk", async () => {
    getTestSessionMock.mockResolvedValue({
      clerkId: "clerk_agent",
      name: "Agent",
      role: "agent",
    });

    const result = await ask(COACH_FIRST_SESSION_STARTERS[0]!);
    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(clerkBuyerConciergeFactsMock).not.toHaveBeenCalled();
  });

  it("returns FORBIDDEN for Clerk non-buyer", async () => {
    getTestSessionMock.mockResolvedValue(null);
    clerkBuyerConciergeFactsMock.mockResolvedValue({
      ok: false,
      reason: "FORBIDDEN",
    });

    const result = await ask(COACH_FIRST_SESSION_STARTERS[0]!);
    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("answers for fixture buyer with discovery-empty file", async () => {
    getTestSessionMock.mockResolvedValue({
      clerkId: SEED_CLERK_IDS.buyerA,
      name: "Alex",
      role: "buyer",
      transactionId: "seed:buyer-a",
      emptyCoachFile: true,
    });

    const result = await ask(COACH_FIRST_SESSION_STARTERS[0]!);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.answer.kind).toBe("answer");
      expect(result.answer.text).toContain("No property is on this file yet");
    }
    expect(clerkBuyerConciergeFactsMock).not.toHaveBeenCalled();
  });

  it("answers for Clerk buyer in server-derived discovery-empty scope", async () => {
    getTestSessionMock.mockResolvedValue(null);
    clerkBuyerConciergeFactsMock.mockResolvedValue({
      ok: true,
      facts: [
        {
          key: "next",
          text: "No property is on this file yet.",
          source: "journeyStages",
        },
      ],
    });

    const result = await ask(COACH_FIRST_SESSION_STARTERS[0]!);
    expect(result.ok).toBe(true);
    expect(clerkBuyerConciergeFactsMock).toHaveBeenCalledTimes(1);
  });

  it("uses Convex file facts for Clerk buyer with a property (ignores any client flag)", async () => {
    getTestSessionMock.mockResolvedValue(null);
    clerkBuyerConciergeFactsMock.mockResolvedValue({
      ok: true,
      facts: [
        {
          key: "next",
          text: "Next is Schedule inspection, assigned to agent.",
          source: "tasks",
        },
      ],
    });

    const result = await ask(COACH_FIRST_SESSION_STARTERS[0]!);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.answer.text).toContain("Schedule inspection");
    }
  });
});
