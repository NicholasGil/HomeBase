import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  COACH_SCROLL_EPOCH_COOKIE,
  COACH_SCROLL_EPOCH_SESSION_KEY,
  coachScrollEpochCookieOptions,
  hrefStartsDemoEnter,
  parseCoachScrollEpochCookie,
  syncCoachScrollEpochFromCookieWithMeta,
} from "@/lib/coach-scroll-epoch";

describe("coach scroll epoch", () => {
  it("parses epoch from cookie header", () => {
    expect(
      parseCoachScrollEpochCookie(`${COACH_SCROLL_EPOCH_COOKIE}=1730000000000`),
    ).toBe("1730000000000");
    expect(parseCoachScrollEpochCookie("")).toBe("0");
  });

  it("detects demo chooser and enter links", () => {
    expect(hrefStartsDemoEnter("/demo")).toBe(true);
    expect(hrefStartsDemoEnter("/demo/enter/buyer-discovery")).toBe(true);
    expect(hrefStartsDemoEnter("/coach")).toBe(false);
  });

  it("uses an 8-hour epoch cookie maxAge", () => {
    expect(coachScrollEpochCookieOptions().maxAge).toBe(8 * 60 * 60);
  });
});

describe("syncCoachScrollEpochFromCookieWithMeta", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
    vi.stubGlobal("document", { cookie: "" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not treat an expired/missing epoch cookie as a persona switch", () => {
    store.set(COACH_SCROLL_EPOCH_SESSION_KEY, "1730000000000");
    const result = syncCoachScrollEpochFromCookieWithMeta();
    expect(result.changed).toBe(false);
    expect(result.epoch).toBe("1730000000000");
  });

  it("syncs when the server sets a new epoch cookie", () => {
    store.set(COACH_SCROLL_EPOCH_SESSION_KEY, "1730000000000");
    vi.stubGlobal("document", {
      cookie: `${COACH_SCROLL_EPOCH_COOKIE}=1730000000999`,
    });
    const result = syncCoachScrollEpochFromCookieWithMeta();
    expect(result.changed).toBe(true);
    expect(result.epoch).toBe("1730000000999");
  });
});
