import { describe, expect, it } from "vitest";

import { SEED_CLERK_IDS } from "../../convex/seedPlan";
import {
  loadSeedTransactionForViewer,
  parseTestSessionCookie,
  startTestSessionDecision,
} from "@/lib/test-session";

const production = { VERCEL_ENV: "production" };

describe("test session permission", () => {
  it("denies fixture login in production", () => {
    expect(
      startTestSessionDecision(SEED_CLERK_IDS.buyerA, production),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("denies unauthorized roles and unknown ids", () => {
    expect(startTestSessionDecision(SEED_CLERK_IDS.agent)).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
    expect(startTestSessionDecision("clerk_vendor")).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
    const lender = startTestSessionDecision(SEED_CLERK_IDS.lender);
    expect(lender.ok).toBe(true);
    if (lender.ok) {
      expect(lender.session.role).toBe("vendor");
      expect(lender.session.name).toBe("Jordan Hale");
    }
    expect(startTestSessionDecision("clerk_stranger")).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
  });

  it("starts a buyer session outside production", () => {
    const started = startTestSessionDecision(SEED_CLERK_IDS.buyerA);
    expect(started.ok).toBe(true);
    if (started.ok && started.session.role === "buyer") {
      expect(started.session.name).toBe("Alex Rivera");
      expect(started.session.transactionId).toBe("seed:buyer-a");
    }
  });

  it("ignores the fixture cookie on a production deploy", () => {
    expect(
      parseTestSessionCookie(SEED_CLERK_IDS.buyerA, production),
    ).toBeNull();
  });
});

describe("seed transaction isolation", () => {
  it("denies an unauthenticated caller", () => {
    expect(loadSeedTransactionForViewer(null, "seed:buyer-a")).toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
  });

  it("denies buyer A loading buyer B by id", () => {
    const started = startTestSessionDecision(SEED_CLERK_IDS.buyerA);
    if (!started.ok) {
      throw new Error("expected buyer A session");
    }
    expect(
      loadSeedTransactionForViewer(started.session, "seed:buyer-b"),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("returns buyer A their own transaction only", () => {
    const started = startTestSessionDecision(SEED_CLERK_IDS.buyerA);
    if (!started.ok) {
      throw new Error("expected buyer A session");
    }
    const loaded = loadSeedTransactionForViewer(
      started.session,
      "seed:buyer-a",
    );
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.view.transactionId).toBe("seed:buyer-a");
      expect(loaded.view.where.key).toBe("inspection");
    }
  });
});
