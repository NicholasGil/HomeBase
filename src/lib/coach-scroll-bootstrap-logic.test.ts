import { describe, expect, it, vi } from "vitest";

import { coachScrollRestoreOnPageShow } from "@/lib/coach-scroll-pageshow";

import {
  COACH_SCROLL_STORAGE_KEY,
  coachScrollStorageKeyForEpoch,
} from "@/lib/coach-scroll-key";
import {
  clampCoachScrollTarget,
  coachScrollBootstrapScriptBody,
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

  it("reads stored scroll offsets keyed by epoch and pathname", () => {
    const coachKey = coachScrollStorageKeyForEpoch("/coach", "42");
    const storage = {
      getItem: (key: string) => (key === coachKey ? "240" : null),
    };
    expect(readCoachScrollYFromStorage(storage, "/coach", "42")).toBe(240);
    expect(
      readCoachScrollYFromStorage({ getItem: () => "nope" }, "/coach", "0"),
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
      epoch,
      storage: {
        getItem: (storageKey: string) =>
          storageKey === key ? "320" : null,
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
      epoch: "0",
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
    expect(script).toContain("syncEpochFromCookie");
    expect(script).toContain("afterCoachNavigationRestore");
    expect(script).toContain("enterSaveBlocked");
    expect(script).toContain("resetScrollRestoration");
    expect(script).toContain("applyDemoCoachScrollReset");
    expect(script).toContain("e.persisted");
    expect(script).toContain("userScrolled");
    expect(script).toContain("markUserScroll");
    expect(script).toContain("touchmove");
    expect(script).toContain("!userScrolled");
  });

  it("keys first-paint restore by location.pathname (not hardcoded /coach)", () => {
    const script = coachScrollBootstrapScript();
    expect(script).toContain("location.pathname");
    expect(script).toMatch(
      /scrollKey\(\)[\s\S]*location\.pathname/,
    );
    expect(script).not.toContain(":'+epoch+':/coach'");
  });

  it("pageshow bfcache restore gate matches client handler", () => {
    expect(coachScrollRestoreOnPageShow({ persisted: true }, "/coach")).toBe(
      true,
    );
    expect(coachScrollRestoreOnPageShow({ persisted: false }, "/coach")).toBe(
      false,
    );
  });

  it.each([
    ["coachScrollBootstrapScript()", () => coachScrollBootstrapScript()],
    [
      "coachScrollBootstrapScriptBody(storage key)",
      () =>
        `(function(){${coachScrollBootstrapScriptBody("realtyrise.coach.scrollY")}})();`,
    ],
    [
      "coachScrollBootstrapScriptBody(custom prefix)",
      () =>
        `(function(){${coachScrollBootstrapScriptBody("custom.prefix.v2")}})();`,
    ],
  ])("parses emitted inline bootstrap script: %s", (_label, scriptFn) => {
    const script = scriptFn();
    expect(() => {
      new Function(script);
    }).not.toThrow();
  });
});
