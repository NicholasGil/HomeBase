import { describe, expect, it, vi } from "vitest";

import {
  COACH_SCROLL_STORAGE_KEY,
  coachScrollStorageKey,
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

  it("reads stored scroll offsets keyed by pathname", () => {
    const coachKey = coachScrollStorageKey("/coach");
    const storage = {
      getItem: (key: string) => (key === coachKey ? "240" : null),
    };
    expect(readCoachScrollYFromStorage(storage, "/coach")).toBe(240);
    expect(
      readCoachScrollYFromStorage({ getItem: () => "nope" }, "/coach"),
    ).toBeNull();
  });

  it("clamps scroll targets to the document", () => {
    expect(clampCoachScrollTarget(500, 1200, 800)).toBe(400);
    expect(clampCoachScrollTarget(120, 900, 800)).toBe(100);
  });

  it("restores scroll on coach when session storage has a value", () => {
    const scrollTo = vi.fn();
    const ok = restoreCoachScrollY({
      pathname: "/coach",
      storage: {
        getItem: () => "320",
      },
      scrollTo,
      scrollHeight: 2000,
      innerHeight: 812,
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
    });
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("coachScrollBootstrapScript", () => {
  it("includes popstate and pageshow listeners for coach restore", () => {
    const script = coachScrollBootstrapScript();
    expect(script).toContain(COACH_SCROLL_STORAGE_KEY);
    expect(script).toContain("popstate");
    expect(script).toContain("pageshow");
    expect(script).toContain("pointerdown");
    expect(script).toContain("pagehide");
    expect(script).toContain("scrollTo");
    expect(script).toContain("resetScrollRestoration");
  });
});
