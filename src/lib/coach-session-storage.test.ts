import { describe, expect, it, beforeEach } from "vitest";

import {
  coachScopeStorageKey,
  markDailyCheckInComplete,
  readCoachThread,
  readCoachVisit,
  shouldShowDailyCheckIn,
  touchCoachVisit,
  utcDayKey,
  writeCoachThread,
} from "@/lib/coach-session-storage";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

describe("coach session storage", () => {
  let storage: MemoryStorage;
  const key = coachScopeStorageKey({
    identity: "clerk_buyer_a",
    scopeKey: "seed:buyer-a",
  });

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it("treats an existing visit record as a return on the next session", () => {
    touchCoachVisit(key, storage, 1);
    expect(readCoachVisit(key, storage)).not.toBeNull();
    const second = touchCoachVisit(key, storage, 2);
    expect(second.isReturnVisit).toBe(true);
  });

  it("shows daily check-in once per UTC day on return", () => {
    touchCoachVisit(key, storage);
    const visit = touchCoachVisit(key, storage);
    const day = utcDayKey();
    expect(shouldShowDailyCheckIn(visit.record, day)).toBe(true);
    markDailyCheckInComplete(key, storage, day);
    const after = touchCoachVisit(key, storage);
    expect(shouldShowDailyCheckIn(after.record, day)).toBe(false);
  });

  it("round-trips concierge thread turns", () => {
    const turns = [
      {
        question: "What happens next?",
        answer: "Schedule inspection.",
        kind: "answer",
      },
    ];
    writeCoachThread(key, storage, turns);
    expect(readCoachThread(key, storage)).toEqual(turns);
  });
});
