import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clampTransactionScrollTarget,
  isTransactionScrollPath,
  readTransactionScrollY,
  transactionScrollStorageKey,
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

  it("clamps scroll targets", () => {
    expect(clampTransactionScrollTarget(900, 1200, 812)).toBe(388);
  });
});
