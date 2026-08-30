import { describe, expect, it } from "vitest";

import { DEFAULT_FEATURE_FLAGS } from "@/lib/flags";
import {
  assertCanUseFixtureDriveTimes,
  driveTimeSource,
  mustFailClosedRoutes,
  ProductionRoutesMisconfiguredError,
  routesNoteForNeedsHuman,
} from "@/lib/routes-config";

describe("routes config fail-closed", () => {
  it("mirrors fixture auth: production without a key is unavailable", () => {
    expect(driveTimeSource({})).toBe("fixture");
    expect(mustFailClosedRoutes({ VERCEL_ENV: "production" })).toBe(true);
    expect(() =>
      assertCanUseFixtureDriveTimes({ VERCEL_ENV: "production" }),
    ).toThrow(ProductionRoutesMisconfiguredError);
    expect(() => assertCanUseFixtureDriveTimes({})).not.toThrow();
  });

  it("points the missing production key at needs-human issue 1", () => {
    const note = routesNoteForNeedsHuman();
    expect(note.issue).toBe(1);
    expect(note.blocked).toBe("GOOGLE_MAPS_ROUTES_API_KEY");
    expect(note.detail).toContain("Do not stub");
  });

  it("does not flip feature flags", () => {
    expect(DEFAULT_FEATURE_FLAGS).toEqual({
      FLAG_MLS: false,
      FLAG_VENDOR_COMP: false,
      FLAG_ESIGN: false,
      FLAG_IDV: false,
    });
  });
});
