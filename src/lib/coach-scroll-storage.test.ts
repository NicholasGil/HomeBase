import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  COACH_SCROLL_EPOCH_COOKIE,
  COACH_SCROLL_EPOCH_SESSION_KEY,
} from "@/lib/coach-scroll-epoch";
import { coachScrollStorageKeyForEpoch } from "@/lib/coach-scroll-key";
import { DEMO_COACH_SCROLL_RESET_COOKIE } from "@/lib/demo-coach-scroll-reset";
import {
  applyCoachPersonaEnterClear,
  coachNavLinkLeavesPath,
  coachScrollYForLeavePersist,
  readCoachScrollY,
  writeCoachScrollY,
} from "@/lib/coach-scroll-storage";

describe("coach scroll storage", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    store.set(COACH_SCROLL_EPOCH_SESSION_KEY, "1");
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
      clear: () => {
        store.clear();
      },
    });
    vi.stubGlobal("document", {
      cookie: `${COACH_SCROLL_EPOCH_COOKIE}=1`,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips scroll depth for the active epoch", () => {
    writeCoachScrollY(280, "/coach");
    expect(readCoachScrollY("/coach")).toBe(280);
    expect(
      store.get(coachScrollStorageKeyForEpoch("/coach", "1")),
    ).toBe("280");
  });

  it("persists zero when leaving coach from the top", () => {
    writeCoachScrollY(365, "/coach");
    writeCoachScrollY(0, "/coach");
    expect(readCoachScrollY("/coach")).toBe(0);
    expect(
      store.get(coachScrollStorageKeyForEpoch("/coach", "1")),
    ).toBe("0");
  });

  it("applyCoachPersonaEnterClear writes zero when reset cookie is present", () => {
    vi.stubGlobal("document", {
      cookie: `${COACH_SCROLL_EPOCH_COOKIE}=1; ${DEMO_COACH_SCROLL_RESET_COOKIE}=1`,
    });
    writeCoachScrollY(365, "/coach");
    const result = applyCoachPersonaEnterClear("/coach");
    expect(result.cleared).toBe(true);
    expect(readCoachScrollY("/coach")).toBe(0);
  });

  it("applyCoachPersonaEnterClear clears depth when epoch cookie bumps", () => {
    writeCoachScrollY(365, "/coach");
    vi.stubGlobal("document", {
      cookie: `${COACH_SCROLL_EPOCH_COOKIE}=2`,
    });
    store.set(COACH_SCROLL_EPOCH_SESSION_KEY, "1");
    const result = applyCoachPersonaEnterClear("/coach");
    expect(result.cleared).toBe(true);
    expect(result.epochChanged).toBe(true);
    expect(readCoachScrollY("/coach")).toBe(0);
  });

  it("coachNavLinkLeavesPath ignores same-route tab taps", () => {
    expect(coachNavLinkLeavesPath("/coach", "/coach")).toBe(false);
    expect(coachNavLinkLeavesPath("/search", "/coach")).toBe(true);
  });

  describe("coachScrollYForLeavePersist", () => {
    it("does not clobber a deeper Y with spurious scrollY=0 on leave", () => {
      expect(coachScrollYForLeavePersist(0, 365)).toBe(365);
    });

    it("captures the current depth when scrollY is still positive on leave", () => {
      expect(coachScrollYForLeavePersist(387, 300)).toBe(387);
    });

    it("persists zero when genuinely at the top on leave", () => {
      expect(coachScrollYForLeavePersist(0, 0)).toBe(0);
    });
  });
});
