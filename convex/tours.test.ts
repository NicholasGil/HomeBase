import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { SEED_TOUR } from "./seedPlan";
import { modules } from "./test.setup";

async function seeded() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  return t;
}

async function candidateIds(t: ReturnType<typeof convexTest>) {
  const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
  const candidates = await asBlair.query(api.tours.listCandidates, {});
  expect(candidates).toHaveLength(4);
  return candidates.map((row) => row._id);
}

describe("showing scheduler", () => {
  it("builds a four-stop itinerary and re-optimizes after removing stop 2", async () => {
    const t = await seeded();
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const propertyIds = await candidateIds(t);

    const built = await asBlair.mutation(api.tours.build, { propertyIds });
    expect(built.stops).toHaveLength(4);
    expect(built.driveTimeSource).toBe("fixture");
    expect(built.departureNotice.message).toContain("notified");
    for (const stop of built.stops) {
      expect(stop.windowViolated).toBe(false);
      expect(stop.arriveAt).toBeGreaterThanOrEqual(stop.windowStartsAt);
      expect(stop.departAt).toBeLessThanOrEqual(stop.windowEndsAt);
      expect(stop.directionsSummary).toContain("Drive");
      expect(stop.property.brief.length).toBeGreaterThan(0);
      expect(stop.property.source).toBe("manual");
    }

    const stopTwo = built.stops[1];
    if (stopTwo === undefined) {
      throw new Error("missing stop 2");
    }
    const removedAddress = stopTwo.property.address.line1;
    const next = await asBlair.mutation(api.tours.removeStop, {
      tourId: built.tourId,
      stopId: stopTwo.stopId,
    });
    expect(next.stops).toHaveLength(3);
    expect(
      next.stops.some((stop) => stop.property.address.line1 === removedAddress),
    ).toBe(false);
    for (const stop of next.stops) {
      expect(stop.windowViolated).toBe(false);
    }

    const firstStop = next.stops[0];
    if (firstStop === undefined) {
      throw new Error("missing first stop");
    }
    const withFeedback = await asBlair.mutation(api.tours.submitFeedback, {
      tourStopId: firstStop.stopId,
      verdict: "love",
      ratings: {
        kitchen: 5,
        location: 4,
        yard: 3,
        condition: 4,
        layout: 5,
        value: 4,
      },
      notes: "Bright kitchen",
    });
    expect(withFeedback.stops[0]?.feedback?.verdict).toBe("love");

    const noticed = await asBlair.mutation(
      api.tours.acknowledgeDepartureNotice,
      { tourId: built.tourId },
    );
    expect(noticed.departureNotice.notifiedAt).not.toBeNull();

    const audit = await t.run(async (ctx) => {
      return await ctx.db.query("auditLog").collect();
    });
    expect(audit.some((row) => row.action === "tour.built")).toBe(true);
    expect(audit.some((row) => row.action === "tour.reoptimized")).toBe(true);
    expect(audit.some((row) => row.action === "showingFeedback.recorded")).toBe(
      true,
    );
    expect(audit.some((row) => row.action === "tour.departure_notice")).toBe(
      true,
    );
  });

  it("keeps buyer A off buyer B's tour", async () => {
    const t = await seeded();
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const propertyIds = await candidateIds(t);
    const built = await asBlair.mutation(api.tours.build, { propertyIds });

    await expect(
      asAlex.query(api.tours.get, { tourId: built.tourId }),
    ).rejects.toThrow("FORBIDDEN");
    const alexTours = await asAlex.query(api.tours.listMine, {});
    expect(alexTours).toHaveLength(0);
  });

  it("refuses MLS listings while FLAG_MLS is off", async () => {
    const t = await seeded();
    const mlsId = await t.run(async (ctx) => {
      return await ctx.db.insert("properties", {
        address: {
          line1: "1 Listing Ave",
          city: "Huntsville",
          state: "AL",
          postalCode: "35801",
        },
        specs: { beds: 3 },
        media: [],
        source: "mls",
        mlsId: "should-not-appear",
        coordinates: SEED_TOUR.origin.coordinates,
        brief: "Must stay hidden while FLAG_MLS is off.",
        showingDurationMinutes: 45,
        availabilityWindows: [...SEED_TOUR.propertyWindows],
      });
    });
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const candidates = await asBlair.query(api.tours.listCandidates, {});
    expect(candidates.some((row) => row._id === mlsId)).toBe(false);
    await expect(
      asBlair.mutation(api.tours.build, { propertyIds: [mlsId] }),
    ).rejects.toThrow("PROPERTY_NOT_TOURABLE");
  });
});
