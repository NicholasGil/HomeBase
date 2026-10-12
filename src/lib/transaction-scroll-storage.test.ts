import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clampTransactionScrollTarget,
  isTransactionScrollPath,
  persistTransactionScrollOnLeave,
  readTransactionScrollY,
  transactionScrollStorageKey,
  transactionScrollYForLeavePersist,
  writeTransactionScrollY,
} from "@/lib/transaction-scroll-storage";

describe("transaction scroll storage", () => {
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recognizes transaction paths", () => {
    expect(isTransactionScrollPath("/transactions/seed:buyer-a")).toBe(true);
    expect(isTransactionScrollPath("/coach")).toBe(false);
  });

  it("round-trips scroll depth per pathname", () => {
    const path = "/transactions/seed:buyer-a";
    writeTransactionScrollY(445, path);
    expect(readTransactionScrollY(path)).toBe(445);
    expect(store.get(transactionScrollStorageKey(path))).toBe("445");
  });

  it("does not clobber positive depth with accidental zero write", () => {
    const path = "/transactions/seed:buyer-a";
    writeTransactionScrollY(597, path);
    writeTransactionScrollY(0, path);
    expect(readTransactionScrollY(path)).toBe(597);
  });

  it("persists zero when forced after user scroll-to-top", () => {
    const path = "/transactions/seed:buyer-a";
    writeTransactionScrollY(597, path);
    writeTransactionScrollY(0, path, { forceZero: true });
    expect(readTransactionScrollY(path)).toBe(0);
  });

  it("clamps scroll targets", () => {
    expect(clampTransactionScrollTarget(900, 1200, 812)).toBe(388);
    expect(clampTransactionScrollTarget(-20, 1200, 812)).toBe(0);
  });

  it("ignores writes and reads off transaction paths", () => {
    writeTransactionScrollY(200, "/coach");
    expect(readTransactionScrollY("/coach")).toBeNull();
    expect(store.size).toBe(0);
    expect(readTransactionScrollY("/search")).toBeNull();
  });

  it("ignores non-finite write values", () => {
    const path = "/transactions/seed:buyer-a";
    writeTransactionScrollY(Number.NaN, path);
    writeTransactionScrollY(Number.POSITIVE_INFINITY, path);
    expect(readTransactionScrollY(path)).toBeNull();
  });

  it("rounds and clamps stored depth to >= 0", () => {
    const path = "/transactions/seed:buyer-a";
    writeTransactionScrollY(445.7, path);
    expect(readTransactionScrollY(path)).toBe(446);
    writeTransactionScrollY(-3.2, path, { forceZero: true });
    expect(readTransactionScrollY(path)).toBe(0);
  });

  it("returns null for missing or invalid stored values", () => {
    const path = "/transactions/seed:buyer-a";
    expect(readTransactionScrollY(path)).toBeNull();
    store.set(transactionScrollStorageKey(path), "not-a-number");
    expect(readTransactionScrollY(path)).toBeNull();
    store.set(transactionScrollStorageKey(path), "");
    expect(readTransactionScrollY(path)).toBeNull();
  });

  it("clampTransactionScrollTarget respects document max scroll", () => {
    expect(clampTransactionScrollTarget(10_000, 900, 812)).toBe(88);
    expect(clampTransactionScrollTarget(0, 500, 812)).toBe(0);
  });

  describe("transactionScrollYForLeavePersist", () => {
    it("skips zero so redrill top does not clobber stored depth", () => {
      expect(transactionScrollYForLeavePersist(0, 0)).toBeNull();
      expect(transactionScrollYForLeavePersist(0, 597)).toBe(597);
    });

    it("does not reuse another txn depth when current scroll and last are zero", () => {
      const pathA = "/transactions/seed:buyer-a";
      const pathB = "/transactions/seed:buyer-b";
      writeTransactionScrollY(597, pathA);
      persistTransactionScrollOnLeave(0, 0, pathB);
      expect(readTransactionScrollY(pathA)).toBe(597);
      expect(readTransactionScrollY(pathB)).toBeNull();
    });
  });
});
