import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

async function seeded() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  return t;
}

describe("concierge scope", () => {
  it("gathers only this transaction's facts and denies other files", async () => {
    const t = await seeded();
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const alex = await asAlex.query(api.transactions.listMine, {});
    const blair = await asBlair.query(api.transactions.listMine, {});
    const alexId = alex[0]?._id;
    const blairId = blair[0]?._id;
    if (alexId === undefined || blairId === undefined) {
      throw new Error("seed transactions missing");
    }

    const facts = await asAlex.query(api.concierge.gatherContext, {
      transactionId: alexId,
    });
    const keys = facts.map((fact) => fact.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "next",
        "inspection_when",
        "missing",
        "cash",
        "inspection_findings",
        "counteroffer",
        "lender",
        "first_showing",
      ]),
    );
    expect(facts.find((fact) => fact.key === "next")?.text).toContain(
      "Schedule inspection",
    );
    expect(facts.find((fact) => fact.key === "cash")?.amountCents).toBe(45000);
    expect(facts.find((fact) => fact.key === "cash")?.provenance).toBe(
      "title_issued",
    );
    expect(facts.find((fact) => fact.key === "lender")?.text).toContain(
      "Jordan Hale",
    );

    await expect(
      asAlex.query(api.concierge.gatherContext, { transactionId: blairId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.query(api.concierge.gatherContext, { transactionId: alexId }),
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      t
        .withIdentity({ subject: "clerk_lender" })
        .query(api.concierge.gatherContext, { transactionId: alexId }),
    ).rejects.toThrow("FORBIDDEN");
  });
});
