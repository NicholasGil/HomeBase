import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("transaction isolation", () => {
  it("buyer A cannot load buyer B's transaction by id", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const asBuyerA = t.withIdentity({ subject: "clerk_buyer_a" });
    const asBuyerB = t.withIdentity({ subject: "clerk_buyer_b" });

    const buyerATransactions = await asBuyerA.query(
      api.transactions.listMine,
      {},
    );
    const buyerBTransactions = await asBuyerB.query(
      api.transactions.listMine,
      {},
    );
    const buyerATransaction = buyerATransactions[0];
    const buyerBTransaction = buyerBTransactions[0];
    if (buyerATransaction === undefined || buyerBTransaction === undefined) {
      throw new Error("seed did not create both buyer transactions");
    }

    expect(buyerATransaction._id).not.toBe(buyerBTransaction._id);

    await expect(
      asBuyerA.query(api.transactions.get, {
        transactionId: buyerBTransaction._id,
      }),
    ).rejects.toThrow("FORBIDDEN");

    await expect(
      asBuyerA.query(api.dashboard.getById, {
        transactionId: buyerBTransaction._id,
      }),
    ).rejects.toThrow("FORBIDDEN");

    const ownDashboard = await asBuyerA.query(api.dashboard.getBuyerDashboard, {});
    expect(ownDashboard?.transactionId).toBe(buyerATransaction._id);
    expect(ownDashboard?.transactionId).not.toBe(buyerBTransaction._id);
    expect(ownDashboard?.where.key).toBe("inspection");
  });

  it("buyer A cannot load buyer B's tour by id", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const asBuyerA = t.withIdentity({ subject: "clerk_buyer_a" });
    const asBuyerB = t.withIdentity({ subject: "clerk_buyer_b" });
    const candidates = await asBuyerB.query(api.tours.listCandidates, {});
    const tour = await asBuyerB.mutation(api.tours.build, {
      propertyIds: candidates.map((row) => row._id),
    });
    await expect(
      asBuyerA.query(api.tours.get, { tourId: tour.tourId }),
    ).rejects.toThrow("FORBIDDEN");
  });
});
