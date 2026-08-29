"use server";

import { getFeatureFlags, type FeatureFlags } from "@/lib/flags";

export async function loadFeatureFlags(): Promise<FeatureFlags> {
  return getFeatureFlags();
}
