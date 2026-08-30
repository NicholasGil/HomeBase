import { describe, expect, it } from "vitest";

import { SEED_TOUR } from "../seedPlan";
import {
  driveTimeSource,
  fetchRoutesApiMatrix,
  fixtureDriveMatrix,
  haversineMiles,
  mustFailClosedRoutes,
  ProductionRoutesMisconfiguredError,
  resolveDriveMatrix,
  routesApiKeyPresent,
} from "./driveTimes";

const origin = SEED_TOUR.origin.coordinates;
const oakwood = SEED_TOUR.properties[0].coordinates;
const madison = SEED_TOUR.properties[1].coordinates;
const harvest = SEED_TOUR.properties[2].coordinates;
const decatur = SEED_TOUR.properties[3].coordinates;

describe("fixture drive times", () => {
  it("uses VERCEL_ENV=production as the fail-closed gate, same as fixture auth", () => {
    expect(driveTimeSource({})).toBe("fixture");
    expect(driveTimeSource({ VERCEL_ENV: "preview" })).toBe("fixture");
    expect(driveTimeSource({ VERCEL_ENV: "production" })).toBe("unavailable");
    expect(mustFailClosedRoutes({ VERCEL_ENV: "production" })).toBe(true);
    expect(
      driveTimeSource({
        VERCEL_ENV: "production",
        GOOGLE_MAPS_ROUTES_API_KEY: "real-key-from-human",
      }),
    ).toBe("routes_api");
    expect(routesApiKeyPresent({})).toBe(false);
  });

  it("never invents a Routes API key and refuses the live fetch without one", async () => {
    await expect(fetchRoutesApiMatrix([origin, decatur], {})).rejects.toThrow(
      "ROUTES_API_KEY_MISSING",
    );
    expect(() =>
      resolveDriveMatrix([origin, decatur], { VERCEL_ENV: "production" }),
    ).toThrow(ProductionRoutesMisconfiguredError);
    expect(() =>
      resolveDriveMatrix([origin, decatur], {
        VERCEL_ENV: "production",
        GOOGLE_MAPS_ROUTES_API_KEY: "real-key-from-human",
      }),
    ).toThrow("ROUTES_API_MATRIX_REQUIRED");
  });

  it("places the four seed listings across a 25-mile spread", () => {
    const pairwise = [
      haversineMiles(oakwood, madison),
      haversineMiles(oakwood, harvest),
      haversineMiles(oakwood, decatur),
      haversineMiles(madison, harvest),
      haversineMiles(madison, decatur),
      haversineMiles(harvest, decatur),
    ];
    const spread = Math.max(...pairwise);
    expect(spread).toBeGreaterThan(20);
    expect(spread).toBeLessThan(30);
    expect(haversineMiles(oakwood, decatur)).toBeGreaterThan(20);
  });

  it("builds a labeled fixture matrix, not a Routes API response", () => {
    const matrix = fixtureDriveMatrix([origin, oakwood, decatur]);
    expect(matrix.source).toBe("fixture");
    expect(matrix.minutes[0]?.[0]).toBe(0);
    expect(matrix.minutes[0]?.[2]).toBeGreaterThan(20);
    expect(
      resolveDriveMatrix([origin, oakwood], { VERCEL_ENV: "preview" }).source,
    ).toBe("fixture");
  });
});
