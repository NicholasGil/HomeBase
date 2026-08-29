import { describe, expect, it } from "vitest";

import { loadFeatureFlags } from "@/app/actions/flags";
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAG_KEYS,
  getFeatureFlags,
  isFeatureEnabled,
} from "@/lib/flags";

describe("feature flags", () => {
  it("defines the four DESIGN.md flags and defaults them off", () => {
    expect([...FEATURE_FLAG_KEYS]).toEqual([
      "FLAG_MLS",
      "FLAG_VENDOR_COMP",
      "FLAG_ESIGN",
      "FLAG_IDV",
    ]);

    for (const key of FEATURE_FLAG_KEYS) {
      expect(DEFAULT_FEATURE_FLAGS[key]).toBe(false);
      expect(getFeatureFlags()[key]).toBe(false);
      expect(isFeatureEnabled(key)).toBe(false);
    }
  });

  it("returns a copy so callers cannot flip the defaults", () => {
    const flags = getFeatureFlags();
    flags.FLAG_MLS = true;
    expect(getFeatureFlags().FLAG_MLS).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS.FLAG_MLS).toBe(false);
  });

  it("exposes the same defaults through the server function", async () => {
    await expect(loadFeatureFlags()).resolves.toEqual({
      FLAG_MLS: false,
      FLAG_VENDOR_COMP: false,
      FLAG_ESIGN: false,
      FLAG_IDV: false,
    });
  });
});
