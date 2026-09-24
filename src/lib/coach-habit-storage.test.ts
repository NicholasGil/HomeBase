import { describe, expect, it } from "vitest";

import {
  coachHabitScopeKey,
  coachHabitStorageKey,
  emptyCoachHabitState,
  hasCoachThread,
  isCoachRepeatVisit,
  mergeCoachHabitTurn,
  parseCoachHabitState,
  recordCoachHabitVisit,
  shouldShowCoachDailyCheckIn,
} from "@/lib/coach-habit-storage";

describe("coachHabitStorageKey", () => {
  it("keys fixture buyers by clerk id and scope", () => {
    expect(
      coachHabitStorageKey({
        clerkId: "clerk_buyer_a",
        scopeKey: "discovery-empty",
      }),
    ).toContain("clerk_buyer_a");
    expect(
      coachHabitScopeKey({
        emptyCoachFile: true,
        transactionId: "seed:buyer-a",
      }),
    ).toBe("discovery-empty");
  });
});

describe("coach habit visit + thread", () => {
  it("treats the second visit as a repeat", () => {
    const first = recordCoachHabitVisit(emptyCoachHabitState());
    expect(first.repeatVisit).toBe(false);
    const second = recordCoachHabitVisit(first.state);
    expect(second.repeatVisit).toBe(true);
    expect(isCoachRepeatVisit(second.state)).toBe(true);
  });

  it("restores a saved thread", () => {
    const withTurn = mergeCoachHabitTurn(emptyCoachHabitState(), {
      asked: "What happens next?",
      answer: "Discovery is your starting stage.",
      kind: "answer",
    });
    const roundTrip = parseCoachHabitState(
      JSON.stringify(withTurn),
    );
    expect(hasCoachThread(roundTrip)).toBe(true);
    expect(roundTrip.thread?.asked).toBe("What happens next?");
  });

  it("shows daily check-in once per local day on repeat visits", () => {
    const visited = recordCoachHabitVisit(emptyCoachHabitState()).state;
    const repeat = recordCoachHabitVisit(visited).state;
    expect(shouldShowCoachDailyCheckIn(repeat, "2026-09-24")).toBe(true);
    const checked = { ...repeat, lastCheckInDay: "2026-09-24" };
    expect(shouldShowCoachDailyCheckIn(checked, "2026-09-24")).toBe(false);
  });
});
