import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  armLeaveCaptureLock,
  hrefLeavesCoachRoute,
  releaseLeaveCaptureLock,
  resolveLeaveCaptureYOffset,
} from "@/lib/coach-scroll-leave-capture";

describe("coach scroll leave capture", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not arm leave capture for same-route coach tab taps", () => {
    expect(hrefLeavesCoachRoute("/coach", "/coach")).toBe(false);
    expect(hrefLeavesCoachRoute("/coach/", "/coach")).toBe(false);
  });

  it("arms leave capture when leaving coach for another route", () => {
    expect(hrefLeavesCoachRoute("/search", "/coach")).toBe(true);
    expect(hrefLeavesCoachRoute("/transactions/seed:buyer-a", "/coach")).toBe(
      true,
    );
  });

  it("resolves leave capture Y without spurious zero over stored depth", () => {
    expect(resolveLeaveCaptureYOffset(0, 347)).toBe(347);
    expect(resolveLeaveCaptureYOffset(0, 0)).toBe(0);
    expect(resolveLeaveCaptureYOffset(280, 347)).toBe(280);
  });

  it("releases a stuck leave lock after releaseLeaveCaptureLock", () => {
    const state = { locked: true, releaseTimerId: null };
    armLeaveCaptureLock(state, { releaseAfterMs: 60_000 });
    expect(state.locked).toBe(true);
    releaseLeaveCaptureLock(state);
    expect(state.locked).toBe(false);
    expect(state.releaseTimerId).toBeNull();
  });

  it("auto-releases leave lock after timeout when navigation does not occur", () => {
    const state = { locked: true, releaseTimerId: null };
    const released = vi.fn();
    armLeaveCaptureLock(state, {
      releaseAfterMs: 500,
      onReleased: released,
    });
    expect(state.locked).toBe(true);
    vi.advanceTimersByTime(500);
    expect(state.locked).toBe(false);
    expect(released).toHaveBeenCalledOnce();
  });
});
