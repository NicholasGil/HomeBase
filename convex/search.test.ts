import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { CANONICAL_SEARCH_QUERY } from "./lib/propertySearch";
import { DEFAULT_FEATURE_FLAGS } from "./lib/validators";
import { modules } from "./test.setup";

async function seeded() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  return t;
}

describe("M9 search server functions", () => {
  it("parses the canonical query, states a reason, and hides MLS while the flag is off", async () => {
    expect(DEFAULT_FEATURE_FLAGS.FLAG_MLS).toBe(false);
    const t = await seeded();
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const result = await asBlair.query(api.search.run, {
      query: CANONICAL_SEARCH_QUERY,
    });
    expect(result.criteria).toEqual({
      beds: 4,
      priceCapCents: 45_000_000,
      minLotAcres: 0.35,
      minGarageSpaces: 2,
      driveMinutesFromTown: 20,
      location: null,
    });
    expect(result.inventory.kind).toBe("sample");
    expect(result.mlsEnabled).toBe(false);
    expect(result.closedFeedReason).toBeNull();
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.every((row) => row.reason.length > 0)).toBe(true);
    expect(result.results.every((row) => row.sampleData)).toBe(true);
    expect(
      result.results.some((row) =>
        row.listing.brief?.includes("licensed feed"),
      ),
    ).toBe(false);
    const org = await t.run(async (ctx) => ctx.db.query("orgs").first());
    expect(org?.flags.FLAG_MLS).toBe(false);
  });

  it("moves a saved listing above a disliked listing on the next rank", async () => {
    const t = await seeded();
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const baseline = await asBlair.query(api.search.run, {
      query: CANONICAL_SEARCH_QUERY,
    });
    const first = baseline.results[0];
    const second = baseline.results[1];
    if (first === undefined || second === undefined) {
      throw new Error("expected ranked rows");
    }
    expect(first.score).toBeGreaterThan(second.score);

    await asBlair.mutation(api.search.recordSignal, {
      propertyId: first.id as Id<"properties">,
      kind: "dislike",
    });
    await asBlair.mutation(api.search.recordSignal, {
      propertyId: second.id as Id<"properties">,
      kind: "save",
    });

    const next = await asBlair.query(api.search.run, {
      query: CANONICAL_SEARCH_QUERY,
    });
    expect(next.results[0]?.id).toBe(second.id);
    expect(next.results.find((row) => row.id === first.id)?.score).toBeLessThan(
      next.results[0]?.score ?? 0,
    );

    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const alex = await asAlex.query(api.search.run, {
      query: CANONICAL_SEARCH_QUERY,
    });
    expect(alex.results[0]?.id).toBe(first.id);

    const audit = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    expect(audit.some((row) => row.action === "propertySignal.dislike")).toBe(
      true,
    );
    expect(audit.some((row) => row.action === "propertySignal.save")).toBe(true);
  });

  it("lets M4 showing feedback change rank and keeps the MLS row out of inventory", async () => {
    const t = await seeded();
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const candidates = await asBlair.query(api.tours.listCandidates, {});
    expect(candidates).toHaveLength(4);
    const built = await asBlair.mutation(api.tours.build, {
      propertyIds: candidates.map((row) => row._id),
    });
    const harvest = built.stops.find((stop) =>
      stop.property.address.line1.includes("Nick Fitcheard"),
    );
    if (harvest === undefined) {
      throw new Error("harvest stop missing");
    }
    await asBlair.mutation(api.tours.submitFeedback, {
      tourStopId: harvest.stopId,
      verdict: "no",
      ratings: {
        kitchen: 2,
        location: 2,
        yard: 2,
        condition: 2,
        layout: 2,
        value: 2,
      },
    });
    const ranked = await asBlair.query(api.search.run, {
      query: CANONICAL_SEARCH_QUERY,
    });
    const harvestRow = ranked.results.find((row) =>
      row.listing.address.line1.includes("Nick Fitcheard"),
    );
    const jones = ranked.results.find((row) =>
      row.listing.address.line1.includes("Valley Wind"),
    );
    if (harvestRow === undefined || jones === undefined) {
      throw new Error("expected harvest and jones valley");
    }
    expect(jones.score).toBeGreaterThan(harvestRow.score);
    expect(ranked.results[0]?.id).not.toBe(harvestRow.id);
    expect(
      ranked.results.some((row) =>
        row.listing.address.line1.includes("Licensed Feed"),
      ),
    ).toBe(false);
  });

  it("denies a vendor", async () => {
    const t = await seeded();
    const asVendor = t.withIdentity({ subject: "clerk_lender" });
    await expect(asVendor.query(api.search.run, {})).rejects.toThrow("FORBIDDEN");
    await expect(asVendor.query(api.search.assertCanSearch, {})).rejects.toThrow(
      "FORBIDDEN",
    );
  });

  it("denies an unauthenticated caller on listing access", async () => {
    const t = await seeded();
    await expect(t.query(api.search.assertCanSearch, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
  });
});
