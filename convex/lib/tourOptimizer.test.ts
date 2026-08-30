import { describe, expect, it } from "vitest";

import { SEED_TOUR } from "../seedPlan";
import { fixtureDriveMatrix, type GeoPoint } from "./driveTimes";
import {
  optimizeTour,
  stopViolatesWindow,
  type TourPropertyInput,
} from "./tourOptimizer";

function seedProperties(): TourPropertyInput[] {
  return SEED_TOUR.properties.map((property) => ({
    id: property.id,
    label: `${property.address.line1}, ${property.address.city}`,
    brief: property.brief,
    coordinates: property.coordinates,
    durationMinutes: SEED_TOUR.appointmentLengthMinutes,
    windows: [...SEED_TOUR.propertyWindows],
  }));
}

function matrixFor(properties: TourPropertyInput[]) {
  const points: GeoPoint[] = [
    SEED_TOUR.origin.coordinates,
    ...properties.map((property) => property.coordinates),
  ];
  return fixtureDriveMatrix(points);
}

function optimizeSeed(properties = seedProperties()) {
  return optimizeTour({
    origin: SEED_TOUR.origin,
    properties,
    buyerWindows: [...SEED_TOUR.buyerWindows],
    agentWindows: [...SEED_TOUR.agentWindows],
    bufferMinutes: SEED_TOUR.bufferMinutes,
    matrix: matrixFor(properties),
  });
}

describe("tour optimizer", () => {
  it("builds a feasible itinerary for four properties across a 25-mile spread", () => {
    const result = optimizeSeed();
    expect(result.kind).toBe("feasible");
    if (result.kind !== "feasible") {
      throw new Error("expected feasible tour");
    }
    expect(result.stops).toHaveLength(4);
    expect(new Set(result.stops.map((stop) => stop.propertyId)).size).toBe(4);
    expect(result.originDepartAt).toBeGreaterThan(0);
    for (const stop of result.stops) {
      expect(stopViolatesWindow(stop)).toBe(false);
      expect(stop.departAt).toBeGreaterThan(stop.arriveAt);
      expect(stop.directionsSummary).toContain("Drive");
      expect(stop.brief.length).toBeGreaterThan(0);
    }
  });

  it("re-optimizes the remainder after removing stop 2 without a manual edit", () => {
    const original = optimizeSeed();
    if (original.kind !== "feasible") {
      throw new Error("expected feasible tour");
    }
    const removed = original.stops[1];
    if (removed === undefined) {
      throw new Error("missing stop 2");
    }
    const remaining = seedProperties().filter(
      (property) => property.id !== removed.propertyId,
    );
    const next = optimizeSeed(remaining);
    expect(next.kind).toBe("feasible");
    if (next.kind !== "feasible") {
      throw new Error("expected re-optimized tour");
    }
    expect(next.stops).toHaveLength(3);
    expect(
      next.stops.some((stop) => stop.propertyId === removed.propertyId),
    ).toBe(false);
    expect(next.stops.map((stop) => stop.propertyId).sort()).toEqual(
      remaining.map((property) => property.id).sort(),
    );
    for (const stop of next.stops) {
      expect(stopViolatesWindow(stop)).toBe(false);
      expect(stop.order).toBeGreaterThan(0);
    }
    const originalRemainder = original.stops
      .filter((stop) => stop.propertyId !== removed.propertyId)
      .map((stop) => `${stop.propertyId}:${stop.arriveAt}:${stop.order}`);
    const reoptimized = next.stops.map(
      (stop) => `${stop.propertyId}:${stop.arriveAt}:${stop.order}`,
    );
    expect(reoptimized).not.toEqual(originalRemainder);
  });

  it("refuses an order that cannot fit a property window", () => {
    const properties = seedProperties();
    const first = properties[0];
    if (first === undefined) {
      throw new Error("missing property");
    }
    first.windows = [
      {
        startsAt: SEED_TOUR.propertyWindows[0].startsAt,
        endsAt: SEED_TOUR.propertyWindows[0].startsAt + 10 * 60 * 1000,
      },
    ];
    const result = optimizeSeed(properties);
    expect(result).toEqual({ kind: "infeasible", reason: "no_feasible_order" });
  });
});
