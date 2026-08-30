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

  it("starts known fixture roles and denies unknown ids", () => {
    const agent = startTestSessionDecision(SEED_CLERK_IDS.agent);
    expect(agent.ok).toBe(true);
    if (agent.ok) {
      expect(agent.session.role).toBe("agent");
      expect(agent.session.name).toBe("Casey Holt");
    }
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
    const closed = startTestSessionDecision(SEED_CLERK_IDS.buyerH);
    expect(closed.ok).toBe(true);
    if (closed.ok && closed.session.role === "buyer") {
      expect(closed.session.name).toBe("Indira Shah");
      expect(closed.session.transactionId).toBe("seed:buyer-h");
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

  it("denies a vendor opening a seed file", () => {
    const started = startTestSessionDecision(SEED_CLERK_IDS.lender);
    if (!started.ok) {
      throw new Error("expected vendor session");
    }
    expect(
      loadSeedTransactionForViewer(started.session, "seed:buyer-a"),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("denies the agent an unknown or non-seed id", () => {
    const started = startTestSessionDecision(SEED_CLERK_IDS.agent);
    if (!started.ok) {
      throw new Error("expected agent session");
    }
    expect(
      loadSeedTransactionForViewer(started.session, "seed:buyer-z"),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(
      loadSeedTransactionForViewer(started.session, "not-a-seed"),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(
      loadSeedTransactionForViewer(started.session, "seed:clerk_buyer_a"),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("lets the seeded agent open a client file by id", () => {
    const started = startTestSessionDecision(SEED_CLERK_IDS.agent);
    if (!started.ok) {
      throw new Error("expected agent session");
    }
    const alex = loadSeedTransactionForViewer(started.session, "seed:buyer-a");
    expect(alex.ok).toBe(true);
    if (alex.ok) {
      expect(alex.view.transactionId).toBe("seed:buyer-a");
      expect(alex.view.where.key).toBe("inspection");
    }
    const dana = loadSeedTransactionForViewer(started.session, "seed:buyer-c");
    expect(dana.ok).toBe(true);
    if (dana.ok) {
      expect(dana.view.transactionId).toBe("seed:buyer-c");
      expect(dana.view.where.key).toBe("financing");
    }
    const encoded = loadSeedTransactionForViewer(
      started.session,
      encodeURIComponent("seed:buyer-a"),
    );
    expect(encoded.ok).toBe(true);
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
