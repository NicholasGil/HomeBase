export const FEATURE_FLAG_KEYS = [
  "FLAG_MLS",
  "FLAG_VENDOR_COMP",
  "FLAG_ESIGN",
  "FLAG_IDV",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

/**
 * P0 defaults from DESIGN.md §8. Flag flips are human decisions.
 * Convex will store the same keys on orgs.flags. Do not turn these on here.
 */
export const DEFAULT_FEATURE_FLAGS = {
  FLAG_MLS: false,
  FLAG_VENDOR_COMP: false,
  FLAG_ESIGN: false,
  FLAG_IDV: false,
} as const satisfies FeatureFlags;

export function getFeatureFlags(): FeatureFlags {
  return { ...DEFAULT_FEATURE_FLAGS };
}

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return getFeatureFlags()[flag];
}
