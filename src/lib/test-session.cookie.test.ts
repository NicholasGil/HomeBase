import { describe, expect, it } from "vitest";

import { SEED_CLERK_IDS } from "../../convex/seedPlan";
import {
  encodeTestSessionCookie,
  parseTestSessionCookie,
  startTestSessionDecision,
} from "@/lib/test-session";

describe("test session cookie", () => {
  it("round-trips empty coach file for Alex", () => {
    const started = startTestSessionDecision(SEED_CLERK_IDS.buyerA, {}, {
      emptyCoachFile: true,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      throw new Error("expected ok");
    }
    const encoded = encodeTestSessionCookie(started.session);
    expect(encoded).toBe(`${SEED_CLERK_IDS.buyerA}~empty`);
    const parsed = parseTestSessionCookie(encoded, {});
    expect(parsed?.role).toBe("buyer");
    if (parsed?.role !== "buyer") {
      throw new Error("expected buyer");
    }
    expect(parsed.emptyCoachFile).toBe(true);
  });

  it("round-trips simulateModelKeyMissing and combined markers", () => {
    const started = startTestSessionDecision(SEED_CLERK_IDS.buyerA, {}, {
      emptyCoachFile: true,
      simulateModelKeyMissing: true,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      throw new Error("expected ok");
    }
    const encoded = encodeTestSessionCookie(started.session);
    expect(encoded).toBe(`${SEED_CLERK_IDS.buyerA}~empty,nomodel`);
    const parsed = parseTestSessionCookie(encoded, {});
    expect(parsed?.role).toBe("buyer");
    if (parsed?.role !== "buyer") {
      throw new Error("expected buyer");
    }
    expect(parsed.emptyCoachFile).toBe(true);
    expect(parsed.simulateModelKeyMissing).toBe(true);
  });
});
