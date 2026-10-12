import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  COACH_SCROLL_EPOCH_COOKIE,
  COACH_SCROLL_EPOCH_SESSION_KEY,
} from "@/lib/coach-scroll-epoch";
import { coachScrollStorageKeyForEpoch } from "@/lib/coach-scroll-key";
import {
  captureCoachScrollBeforeLeave,
  readCoachScrollY,
  writeCoachScrollY,
} from "@/lib/coach-scroll-storage";

describe("coach scroll storage leave capture", () => {
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

  it("does not replace a stored depth with a spurious zero on leave", () => {
    writeCoachScrollY(347, "/coach");
    captureCoachScrollBeforeLeave(0);
    expect(readCoachScrollY("/coach")).toBe(347);
  });

  it("persists zero when the user left from the top", () => {
    writeCoachScrollY(0, "/coach");
    captureCoachScrollBeforeLeave(0);
    expect(readCoachScrollY("/coach")).toBe(0);
  });

  it("records the captured positive offset on leave", () => {
    captureCoachScrollBeforeLeave(280);
    expect(readCoachScrollY("/coach")).toBe(280);
    expect(
      store.get(coachScrollStorageKeyForEpoch("/coach", "1")),
    ).toBe("280");
  });
});
