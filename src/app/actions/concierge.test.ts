import { beforeEach, describe, expect, it, vi } from "vitest";

import { COACH_FIRST_SESSION_STARTERS } from "@/lib/coach-first-session";
import { SEED_CLERK_IDS } from "../../../convex/seedPlan";

const getTestSessionMock = vi.fn();
const clerkBuyerConciergeContextMock = vi.fn();

vi.mock("@/app/actions/test-session", () => ({
  getTestSession: getTestSessionMock,
}));

vi.mock("@/lib/concierge-clerk-buyer", () => ({
  clerkBuyerConciergeContext: clerkBuyerConciergeContextMock,
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
    clerkBuyerConciergeContextMock.mockReset();
  });

  async function ask(
    input: { question: string; discoveryEmpty?: boolean },
  ) {
    const { askConcierge } = await import("@/app/actions/concierge");
    return askConcierge(input);
  }

  it("returns FORBIDDEN for fixture non-buyer without calling Clerk", async () => {
    getTestSessionMock.mockResolvedValue({
      clerkId: "clerk_agent",
      name: "Agent",
      role: "agent",
    });

    const result = await ask({
      question: COACH_FIRST_SESSION_STARTERS[0]!,
      discoveryEmpty: true,
    });
    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(clerkBuyerConciergeContextMock).not.toHaveBeenCalled();
  });

  it("returns FORBIDDEN for Clerk non-buyer with discoveryEmpty", async () => {
    getTestSessionMock.mockResolvedValue(null);
    clerkBuyerConciergeContextMock.mockResolvedValue({
      ok: false,
      reason: "FORBIDDEN",
    });

    const result = await ask({
      question: COACH_FIRST_SESSION_STARTERS[0]!,
      discoveryEmpty: true,
    });
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

    const result = await ask({
      question: COACH_FIRST_SESSION_STARTERS[0]!,
      discoveryEmpty: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.answer.kind).toBe("answer");
      expect(result.answer.text.length).toBeGreaterThan(10);
    }
  });

  it("answers for Convex buyer in discovery-empty scope", async () => {
    getTestSessionMock.mockResolvedValue(null);
    clerkBuyerConciergeContextMock.mockResolvedValue({
      ok: true,
      discoveryEmpty: true,
    });

    const result = await ask({
      question: COACH_FIRST_SESSION_STARTERS[0]!,
      discoveryEmpty: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.answer.kind).toBe("answer");
    }
  });

  it("returns FORBIDDEN when buyer has a property but client sends discoveryEmpty", async () => {
    getTestSessionMock.mockResolvedValue(null);
    clerkBuyerConciergeContextMock.mockResolvedValue({
      ok: true,
      discoveryEmpty: false,
    });

    const result = await ask({
      question: COACH_FIRST_SESSION_STARTERS[0]!,
      discoveryEmpty: true,
    });
    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
  });
});
