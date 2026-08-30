import { describe, expect, it } from "vitest";

import { SEED_CLERK_IDS } from "../../convex/seedPlan";
import { SEED_TOUR_PROPERTY_IDS } from "@/lib/seed-tours";
import {
  buildFixtureTour,
  fixtureStopViolatesWindow,
  getFixtureTour,
  listFixtureCandidates,
  listFixtureTours,
  removeFixtureStop,
  submitFixtureFeedback,
} from "@/lib/tour-access";

const blair = { clerkId: SEED_CLERK_IDS.buyerB, role: "buyer" as const };
const alex = { clerkId: SEED_CLERK_IDS.buyerA, role: "buyer" as const };
const jordan = { clerkId: SEED_CLERK_IDS.lender, role: "vendor" as const };

const fourIds = [
  SEED_TOUR_PROPERTY_IDS.oakwood,
  SEED_TOUR_PROPERTY_IDS.madison,
  SEED_TOUR_PROPERTY_IDS.harvest,
  SEED_TOUR_PROPERTY_IDS.decatur,
];

describe("fixture tour access", () => {
  it("returns EMPTY when no listings are selected", () => {
    expect(
      buildFixtureTour({
        viewer: blair,
        propertyIds: [],
        state: { tours: [] },
      }),
    ).toEqual({ ok: false, reason: "EMPTY" });
  });

  it("denies unauthenticated and vendor readers", () => {
    expect(listFixtureCandidates(null)).toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
    expect(listFixtureCandidates(jordan)).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
    expect(listFixtureTours({ viewer: null, state: { tours: [] } })).toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
  });

  it("builds four stops, then re-optimizes after removing stop 2", () => {
    const built = buildFixtureTour({
      viewer: blair,
      propertyIds: fourIds,
      state: { tours: [] },
    });
    expect(built.ok).toBe(true);
    if (!built.ok) {
      throw new Error("build failed");
    }
    expect(built.tour.stops).toHaveLength(4);
    expect(built.tour.driveTimeSource).toBe("fixture");
    for (const stop of built.tour.stops) {
      expect(fixtureStopViolatesWindow(stop)).toBe(false);
    }

    const stopTwo = built.tour.stops[1];
    if (stopTwo === undefined) {
      throw new Error("missing stop 2");
    }
    const next = removeFixtureStop({
      viewer: blair,
      state: built.state,
      tourId: built.tour.tourId,
      stopId: stopTwo.stopId,
    });
    expect(next.ok).toBe(true);
    if (!next.ok) {
      throw new Error("remove failed");
    }
    expect(next.tour.stops).toHaveLength(3);
    expect(
      next.tour.stops.some((stop) => stop.propertyId === stopTwo.propertyId),
    ).toBe(false);
    for (const stop of next.tour.stops) {
      expect(fixtureStopViolatesWindow(stop)).toBe(false);
    }
  });

  it("keeps Alex off Blair's fixture tour", () => {
    const built = buildFixtureTour({
      viewer: blair,
      propertyIds: fourIds,
      state: { tours: [] },
    });
    if (!built.ok) {
      throw new Error("build failed");
    }
    expect(
      getFixtureTour({
        viewer: alex,
        state: built.state,
        tourId: built.tour.tourId,
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(listFixtureTours({ viewer: alex, state: built.state })).toEqual({
      ok: true,
      tours: [],
    });
  });

  it("writes showingFeedback onto a stop", () => {
    const built = buildFixtureTour({
      viewer: blair,
      propertyIds: fourIds,
      state: { tours: [] },
    });
    if (!built.ok) {
      throw new Error("build failed");
    }
    const first = built.tour.stops[0];
    if (first === undefined) {
      throw new Error("missing stop");
    }
    const recorded = submitFixtureFeedback({
      viewer: blair,
      state: built.state,
      tourId: built.tour.tourId,
      stopId: first.stopId,
      verdict: "maybe",
      ratings: {
        kitchen: 3,
        location: 4,
        yard: 2,
        condition: 3,
        layout: 4,
        value: 3,
      },
    });
    expect(recorded.ok).toBe(true);
    if (!recorded.ok) {
      throw new Error("feedback failed");
    }
    expect(recorded.tour.feedback[0]?.verdict).toBe("maybe");
  });
});
