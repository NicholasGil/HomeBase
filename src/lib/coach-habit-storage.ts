/** Fixture `/test-login` coach continuity — browser localStorage only. */

export const COACH_HABIT_STORAGE_VERSION = 1;

export type CoachHabitTurn = {
  asked: string;
  answer: string;
  kind: string;
};

export type CoachHabitState = {
  version: number;
  visitCount: number;
  lastVisitAt: number | null;
  lastCheckInDay: string | null;
  thread: CoachHabitTurn | null;
};

export function coachHabitStorageKey(input: {
  clerkId: string;
  scopeKey: string;
}): string {
  return `realtyrise.coach-habit.v${COACH_HABIT_STORAGE_VERSION}:${input.clerkId}:${input.scopeKey}`;
}

export function coachHabitScopeKey(input: {
  emptyCoachFile?: boolean;
  transactionId: string;
}): string {
  return input.emptyCoachFile ? "discovery-empty" : input.transactionId;
}

export function coachHabitStorageKeyForFixtureBuyer(input: {
  clerkId: string;
  emptyCoachFile?: boolean;
  transactionId: string;
}): string {
  return coachHabitStorageKey({
    clerkId: input.clerkId,
    scopeKey: coachHabitScopeKey({
      emptyCoachFile: input.emptyCoachFile,
      transactionId: input.transactionId,
    }),
  });
}

export function emptyCoachHabitState(): CoachHabitState {
  return {
    version: COACH_HABIT_STORAGE_VERSION,
    visitCount: 0,
    lastVisitAt: null,
    lastCheckInDay: null,
    thread: null,
  };
}

export function parseCoachHabitState(raw: string | null): CoachHabitState {
  if (raw === null || raw.length === 0) {
    return emptyCoachHabitState();
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CoachHabitState>;
    if (parsed.version !== COACH_HABIT_STORAGE_VERSION) {
      return emptyCoachHabitState();
    }
    const thread = parsed.thread;
    const turn =
      thread &&
      typeof thread.asked === "string" &&
      typeof thread.answer === "string" &&
      typeof thread.kind === "string"
        ? thread
        : null;
    return {
      version: COACH_HABIT_STORAGE_VERSION,
      visitCount:
        typeof parsed.visitCount === "number" && parsed.visitCount >= 0
          ? parsed.visitCount
          : 0,
      lastVisitAt:
        typeof parsed.lastVisitAt === "number" ? parsed.lastVisitAt : null,
      lastCheckInDay:
        typeof parsed.lastCheckInDay === "string"
          ? parsed.lastCheckInDay
          : null,
      thread: turn,
    };
  } catch {
    return emptyCoachHabitState();
  }
}

export function serializeCoachHabitState(state: CoachHabitState): string {
  return JSON.stringify(state);
}

/** True when the buyer has opened this coach scope before (not the first mount). */
export function isCoachRepeatVisit(state: CoachHabitState): boolean {
  return state.visitCount > 0;
}

export function hasCoachThread(state: CoachHabitState): boolean {
  return state.thread !== null;
}

export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function recordCoachHabitVisit(
  state: CoachHabitState,
  now = Date.now(),
): { state: CoachHabitState; repeatVisit: boolean } {
  const repeatVisit = state.visitCount > 0;
  return {
    repeatVisit,
    state: {
      ...state,
      visitCount: state.visitCount + 1,
      lastVisitAt: now,
    },
  };
}

export function mergeCoachHabitTurn(
  state: CoachHabitState,
  turn: CoachHabitTurn,
): CoachHabitState {
  return { ...state, thread: turn };
}

export function markCoachDailyCheckIn(
  state: CoachHabitState,
  dayKey: string,
): CoachHabitState {
  return { ...state, lastCheckInDay: dayKey };
}

export function shouldShowCoachDailyCheckIn(
  state: CoachHabitState,
  dayKey: string,
): boolean {
  return isCoachRepeatVisit(state) && state.lastCheckInDay !== dayKey;
}
