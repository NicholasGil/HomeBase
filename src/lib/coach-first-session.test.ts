import { describe, expect, it } from "vitest";

import {
  COACH_FIRST_SESSION_STARTERS,
  isCoachDiscoveryEmptyScope,
} from "@/lib/coach-first-session";

describe("coach first session", () => {
  it("detects Discovery empty scope", () => {
    expect(
      isCoachDiscoveryEmptyScope({
        address: "No property on this file yet",
        stage: "Discovery",
      }),
    ).toBe(true);
    expect(
      isCoachDiscoveryEmptyScope({
        address: "814 Maple Ave, Huntsville",
        stage: "Discovery",
      }),
    ).toBe(false);
  });

  it("ships exactly three locked starter labels", () => {
    expect(COACH_FIRST_SESSION_STARTERS).toEqual([
      "What happens next?",
      "What am I missing for this stage?",
      "What's already on my file?",
    ]);
  });
});
