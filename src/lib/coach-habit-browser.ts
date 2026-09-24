"use client";

import {
  type CoachHabitState,
  type CoachHabitTurn,
  parseCoachHabitState,
  serializeCoachHabitState,
} from "@/lib/coach-habit-storage";

export function readCoachHabitFromBrowser(storageKey: string): CoachHabitState {
  if (typeof window === "undefined") {
    return parseCoachHabitState(null);
  }
  return parseCoachHabitState(window.localStorage.getItem(storageKey));
}

export function writeCoachHabitToBrowser(
  storageKey: string,
  state: CoachHabitState,
): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(storageKey, serializeCoachHabitState(state));
}

export function persistCoachHabitTurn(
  storageKey: string,
  state: CoachHabitState,
  turn: CoachHabitTurn,
): CoachHabitState {
  const next = { ...state, thread: turn };
  writeCoachHabitToBrowser(storageKey, next);
  return next;
}
