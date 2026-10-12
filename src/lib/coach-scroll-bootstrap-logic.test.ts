import { describe, expect, it, vi } from "vitest";

import {
  COACH_SCROLL_STORAGE_KEY,
  coachScrollStorageKeyForEpoch,
} from "@/lib/coach-scroll-key";
import {
  clampCoachScrollTarget,
  isCoachScrollPath,
  readCoachScrollYFromStorage,
  restoreCoachScrollY,
} from "@/lib/coach-scroll-bootstrap-logic";
import { coachScrollBootstrapScript } from "@/lib/coach-scroll-bootstrap-script";

describe("coach scroll bootstrap logic", () => {
  it("recognizes coach paths", () => {
    expect(isCoachScrollPath("/coach")).toBe(true);
    expect(isCoachScrollPath("/coach/thread")).toBe(true);
    expect(isCoachScrollPath("/pricing")).toBe(false);
  });

  it("reads stored scroll offsets keyed by pathname and epoch", () => {
    const coachKey = coachScrollStorageKeyForEpoch("/coach", "42");
    const storage = {
      getItem: (key: string) => (key === coachKey ? "240" : null),
    };
    expect(readCoachScrollYFromStorage(storage, "/coach", "42")).toBe(240);
    expect(
      readCoachScrollYFromStorage({ getItem: () => "nope" }, "/coach", "42"),
    ).toBeNull();
  });

  it("clamps scroll targets to the document", () => {
    expect(clampCoachScrollTarget(500, 1200, 800)).toBe(400);
    expect(clampCoachScrollTarget(120, 900, 800)).toBe(100);
  });

  it("restores scroll on coach when session storage has a value", () => {
    const scrollTo = vi.fn();
    const epoch = "9";
    const key = coachScrollStorageKeyForEpoch("/coach", epoch);
    const ok = restoreCoachScrollY({
      pathname: "/coach",
      storage: {
        getItem: (storageKey: string) =>
          storageKey === key ? "320" : null,
      },
      scrollTo,
      scrollHeight: 2000,
      innerHeight: 812,
      epoch,
    });
    expect(ok).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith(0, 320);
  });

  it("skips restore off coach or without a stored offset", () => {
    const scrollTo = vi.fn();
    restoreCoachScrollY({
      pathname: "/search",
      storage: { getItem: () => "200" },
      scrollTo,
      scrollHeight: 2000,
      innerHeight: 812,
      epoch: "0",
    });
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("coachScrollBootstrapScript", () => {
  it("includes epoch sync and coach-only restore hooks", () => {
    const script = coachScrollBootstrapScript();
    expect(script).toContain(COACH_SCROLL_STORAGE_KEY);
    expect(script).toContain("syncEpochFromCookie");
    expect(script).toContain("markEnterStarted");
    expect(script).toContain("popstate");
    expect(script).toContain("pageshow");
    expect(script).toContain("pointerdown");
    expect(script).toContain("scrollTo");
    expect(script).toContain("applyDemoCoachScrollReset");
    expect(script).toContain("markEnterStarted");
    expect(script).not.toContain("scheduleRestore");
  });
});
