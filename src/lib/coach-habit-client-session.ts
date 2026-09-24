"use client";

import {
  readCoachHabitFromBrowser,
  writeCoachHabitToBrowser,
} from "@/lib/coach-habit-browser";
import {
  emptyCoachHabitState,
  hasCoachThread,
  isCoachRepeatVisit,
  localDayKey,
  markCoachDailyCheckIn,
  mergeCoachHabitTurn,
  recordCoachHabitVisit,
  shouldShowCoachDailyCheckIn,
  type CoachHabitState,
  type CoachHabitTurn,
} from "@/lib/coach-habit-storage";

export type CoachHabitSessionView = {
  repeatVisit: boolean;
  habitSnapshot: CoachHabitState;
  initialTurn: CoachHabitTurn | null;
  showDailyCheckIn: boolean;
};

const sessionViews = new Map<string, CoachHabitSessionView>();
const listeners = new Set<() => void>();

function visitSessionFlag(storageKey: string) {
  return `coach-habit-visit:${storageKey}`;
}

function notifyCoachHabitListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeCoachHabitSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function ensureCoachHabitSession(storageKey: string): CoachHabitSessionView {
  const cached = sessionViews.get(storageKey);
  if (cached !== undefined) {
    return cached;
  }

  const prior = readCoachHabitFromBrowser(storageKey);
  const repeatVisit = isCoachRepeatVisit(prior);

  let habitSnapshot = prior;
  if (!sessionStorage.getItem(visitSessionFlag(storageKey))) {
    habitSnapshot = recordCoachHabitVisit(prior).state;
    writeCoachHabitToBrowser(storageKey, habitSnapshot);
    sessionStorage.setItem(visitSessionFlag(storageKey), "1");
  }

  const day = localDayKey(new Date());
  let showDailyCheckIn = false;
  if (repeatVisit && shouldShowCoachDailyCheckIn(habitSnapshot, day)) {
    showDailyCheckIn = true;
    habitSnapshot = markCoachDailyCheckIn(habitSnapshot, day);
    writeCoachHabitToBrowser(storageKey, habitSnapshot);
  }

  const view: CoachHabitSessionView = {
    repeatVisit,
    habitSnapshot,
    initialTurn: hasCoachThread(prior) ? prior.thread : null,
    showDailyCheckIn,
  };
  sessionViews.set(storageKey, view);
  return view;
}

export function getCoachHabitSessionSnapshot(
  storageKey: string,
): CoachHabitSessionView | null {
  if (typeof window === "undefined") {
    return null;
  }
  return ensureCoachHabitSession(storageKey);
}

export function persistCoachHabitSessionTurn(
  storageKey: string,
  turn: CoachHabitTurn,
): CoachHabitSessionView {
  const current =
    sessionViews.get(storageKey) ?? ensureCoachHabitSession(storageKey);
  const habitSnapshot = mergeCoachHabitTurn(current.habitSnapshot, turn);
  writeCoachHabitToBrowser(storageKey, habitSnapshot);
  const next: CoachHabitSessionView = {
    ...current,
    habitSnapshot,
    initialTurn: turn,
  };
  sessionViews.set(storageKey, next);
  notifyCoachHabitListeners();
  return next;
}

/** Read-only continue label (does not record visits). */
export function coachReturnContinueLabel(
  storageKey: string,
  firstSession: boolean,
): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const prior = readCoachHabitFromBrowser(storageKey);
  if (!isCoachRepeatVisit(prior)) {
    return null;
  }
  if (hasCoachThread(prior) && prior.thread) {
    return prior.thread.asked;
  }
  if (firstSession) {
    return "";
  }
  return null;
}

export function emptyCoachHabitSessionView(): CoachHabitSessionView {
  return {
    repeatVisit: false,
    habitSnapshot: emptyCoachHabitState(),
    initialTurn: null,
    showDailyCheckIn: false,
  };
}
