import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
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

    await expect(
      asBuyerA.query(api.vendors.listForStage, {
        transactionId: buyerBTransaction._id,
      }),
    ).rejects.toThrow("FORBIDDEN");
    const ownVendors = await asBuyerA.query(api.vendors.listForStage, {
      transactionId: buyerATransaction._id,
    });
    expect(ownVendors.vendors.map((row) => row.name)).toContain("Riley Brooks");
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

  it("buyer A cannot load buyer B's offer center", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const asBuyerA = t.withIdentity({ subject: "clerk_buyer_a" });
    const asBuyerB = t.withIdentity({ subject: "clerk_buyer_b" });
    const buyerBTransactions = await asBuyerB.query(
      api.transactions.listMine,
      {},
    );
    const buyerBTransaction = buyerBTransactions[0];
    if (buyerBTransaction === undefined) {
      throw new Error("buyer B missing transaction");
    }
    await expect(
      asBuyerA.query(api.offers.getCenter, {
        transactionId: buyerBTransaction._id,
      }),
    ).rejects.toThrow("FORBIDDEN");
    const drafted = await asBuyerB.mutation(api.offers.ensureDraft, {
      transactionId: buyerBTransaction._id,
    });
    const offerId = drafted.offer?._id;
    if (offerId === undefined) {
      throw new Error("buyer B draft missing");
    }
    await expect(
      asBuyerA.mutation(api.offers.submit, { offerId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asBuyerA.query(api.offers.simulate, {
        transactionId: buyerBTransaction._id,
        purchasePriceCents: 41000000,
        downPaymentCents: 8200000,
        sellerConcessionsCents: 0,
        rateBps: 675,
        program: "conventional",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asBuyerA.query(api.explainer.listSections, {
        transactionId: buyerBTransaction._id,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("buyer A cannot load buyer B's signature packet", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const asBuyerA = t.withIdentity({ subject: "clerk_buyer_a" });
    const asBuyerB = t.withIdentity({ subject: "clerk_buyer_b" });
    const buyerATransactions = await asBuyerA.query(
      api.transactions.listMine,
      {},
    );
    const buyerATransaction = buyerATransactions[0];
    if (buyerATransaction === undefined) {
      throw new Error("buyer A missing transaction");
    }
    await expect(
      asBuyerB.query(api.esign.listForTransaction, {
        transactionId: buyerATransaction._id,
      }),
    ).rejects.toThrow("FORBIDDEN");
    const packets = await asBuyerA.query(api.esign.listMine, {});
    const first = packets[0];
    if (first === undefined) {
      throw new Error("seed packet missing");
    }
    await expect(
      asBuyerB.query(api.esign.getPacket, { packetId: first._id }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("buyer A saves do not change buyer B's search rank", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const asBuyerA = t.withIdentity({ subject: "clerk_buyer_a" });
    const asBuyerB = t.withIdentity({ subject: "clerk_buyer_b" });
    const baseline = await asBuyerB.query(api.search.run, {});
    const first = baseline.results[0];
    if (first === undefined) {
      throw new Error("search missing results");
    }
    await asBuyerA.mutation(api.search.recordSignal, {
      propertyId: first.id as Id<"properties">,
      kind: "dislike",
    });
    const blair = await asBuyerB.query(api.search.run, {});
    expect(blair.results[0]?.id).toBe(first.id);
    const alex = await asBuyerA.query(api.search.run, {});
    expect(alex.results[0]?.id).not.toBe(first.id);
  });

  it("buyer cannot load the agent command center", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const asBuyerA = t.withIdentity({ subject: "clerk_buyer_a" });
    await expect(asBuyerA.query(api.commandCenter.getMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
  });
});
