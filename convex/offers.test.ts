import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import { collectScenarioFigures, everyFigureHasProvenance } from "./lib/offerModel";
import schema from "./schema";
import { modules } from "./test.setup";

async function seeded() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  return t;
}

async function blairTransactionId(t: ReturnType<typeof convexTest>) {
  const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
  const mine = await asBlair.query(api.transactions.listMine, {});
  const first = mine[0];
  if (first === undefined) {
    throw new Error("blair has no transaction");
  }
  return first._id;
}

async function alexTransactionId(t: ReturnType<typeof convexTest>) {
  const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
  const mine = await asAlex.query(api.transactions.listMine, {});
  const first = mine[0];
  if (first === undefined) {
    throw new Error("alex has no transaction");
  }
  return first._id;
}

describe("offer center", () => {
  it("renders three scenarios with tradeoffs and provenance on every figure", async () => {
    const t = await seeded();
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const center = await asBlair.query(api.offers.getMine, {});
    if (center === null) {
      throw new Error("missing offer center");
    }
    expect(center.market.sampleData).toBe("sample data");
    expect(center.market.daysOnMarket).toBeGreaterThan(0);
    expect(center.market.priceReductions).toEqual([]);
    expect(center.market.competingInventory.count).toBeGreaterThanOrEqual(5);
    expect(center.market.comps).toHaveLength(2);
    expect(center.market.listPrice.provenance).toBe("user_entered");
    expect(center.scenarios).toHaveLength(3);
    expect(center.scenarios.map((row) => row.strategy)).toEqual([
      "stronger",
      "balanced",
      "value",
    ]);
    for (const scenario of center.scenarios) {
      expect(scenario.tradeoffs.length).toBeGreaterThan(0);
      expect(
        everyFigureHasProvenance(collectScenarioFigures(scenario)),
      ).toBe(true);
    }
    expect(center.offer).toBeNull();
  });

  it("keeps the seeded offer unsigned and rejects submit until a licensee reviews", async () => {
    const t = await seeded();
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const asAgent = t.withIdentity({ subject: "clerk_agent" });
    const seededOffer = await t.run(async (ctx) => {
      const offers = await ctx.db.query("offers").collect();
      const first = offers[0];
      if (first === undefined) {
        throw new Error("seed offer missing");
      }
      return first;
    });
    expect(seededOffer.reviewedByLicenseeId).toBeUndefined();
    expect(seededOffer.status).toBe("submitted");

    const alexCenter = await asAlex.query(api.offers.getMine, {});
    expect(alexCenter?.offer?.reviewedByLicenseeId).toBeNull();
    expect(alexCenter?.offer?.gate.reason).toBe("already_submitted");

    const transactionId = await blairTransactionId(t);
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const drafted = await asBlair.mutation(api.offers.ensureDraft, {
      transactionId,
    });
    const offerId = drafted.offer?._id;
    if (offerId === undefined) {
      throw new Error("draft missing");
    }
    expect(drafted.offer?.reviewedByLicenseeId).toBeNull();
    expect(drafted.offer?.gate.reason).toBe("LICENSEE_REVIEW_REQUIRED");

    await expect(asBlair.mutation(api.offers.submit, { offerId })).rejects.toThrow(
      "LICENSEE_REVIEW_REQUIRED",
    );
    await expect(asBlair.mutation(api.offers.review, { offerId })).rejects.toThrow(
      "FORBIDDEN",
    );

    const reviewed = await asAgent.mutation(api.offers.review, { offerId });
    expect(reviewed.offer?.reviewedByLicenseeId).toBeTruthy();
    expect(reviewed.offer?.gate.canSubmit).toBe(true);

    const submitted = await asBlair.mutation(api.offers.submit, { offerId });
    expect(submitted.offer?.status).toBe("submitted");
    expect(submitted.offer?.submittedAt).toBeTruthy();

    const audit = await t.run(async (ctx) => {
      return await ctx.db.query("auditLog").collect();
    });
    expect(audit.some((row) => row.action === "offer.drafted")).toBe(true);
    expect(audit.some((row) => row.action === "offer.reviewed")).toBe(true);
    expect(audit.some((row) => row.action === "offer.submitted")).toBe(true);
  });

  it("keeps buyer A off buyer B's offer center", async () => {
    const t = await seeded();
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const blairId = await blairTransactionId(t);
    const alexId = await alexTransactionId(t);
    await expect(
      asAlex.query(api.offers.getCenter, { transactionId: blairId }),
    ).rejects.toThrow("FORBIDDEN");
    const own = await asAlex.query(api.offers.getCenter, {
      transactionId: alexId,
    });
    expect(own.transactionId).toBe(alexId);
  });
});
