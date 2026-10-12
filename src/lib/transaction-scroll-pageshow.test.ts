import { describe, expect, it } from "vitest";

import { transactionScrollRestoreOnPageShow } from "@/lib/transaction-scroll-pageshow";

describe("transactionScrollRestoreOnPageShow", () => {
  it("restores when bfcache persisted on a transaction route", () => {
    expect(
      transactionScrollRestoreOnPageShow(
        { persisted: true },
        "/transactions/seed:buyer-a",
      ),
    ).toBe(true);
  });

  it("skips when not persisted", () => {
    expect(
      transactionScrollRestoreOnPageShow(
        { persisted: false },
        "/transactions/seed:buyer-a",
      ),
    ).toBe(false);
  });

  it("skips off transaction routes", () => {
    expect(
      transactionScrollRestoreOnPageShow({ persisted: true }, "/coach"),
    ).toBe(false);
  });
});
