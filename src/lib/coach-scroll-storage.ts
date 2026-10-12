import { isCoachScrollPath } from "@/lib/coach-scroll-bootstrap-logic";
import {
  COACH_SCROLL_STORAGE_KEY,
  coachScrollStorageKey,
} from "@/lib/coach-scroll-key";

export function readCoachScrollY(pathname: string): number | null {
  const key = coachScrollStorageKey(pathname);
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    const y = Number.parseInt(raw, 10);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

export function writeCoachScrollY(y: number, pathname: string): void {
  const key = coachScrollStorageKey(pathname);
  try {
    sessionStorage.setItem(key, String(Math.max(0, Math.round(y))));
  } catch {
    // Private mode / quota — ignore.
  }
}

/** Persist only when the live document is on /coach (avoids stale React pathname races). */
const LEAVE_CAPTURE_LOCK_KEY = "realtyrise.coach.scrollY.leaveCaptureLock";

export function setCoachScrollLeaveCaptureLock(locked: boolean): void {
  try {
    if (locked) {
      sessionStorage.setItem(LEAVE_CAPTURE_LOCK_KEY, "1");
    } else {
      sessionStorage.removeItem(LEAVE_CAPTURE_LOCK_KEY);
    }
  } catch {
    // ignore
  }
}

function coachScrollLeaveCaptureLocked(): boolean {
  try {
    return sessionStorage.getItem(LEAVE_CAPTURE_LOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function persistCoachScrollYOffset(y: number): void {
  if (coachScrollLeaveCaptureLocked()) {
    return;
  }
  const pathname = window.location.pathname;
  if (!isCoachScrollPath(pathname)) {
    return;
  }
  writeCoachScrollY(y, pathname);
}

/** Pointerdown leave capture: never clobber a deeper stored Y with a spurious 0. */
export function captureCoachScrollBeforeLeave(y: number): void {
  const rounded = Math.max(0, Math.round(y));
  const existing = readCoachScrollY("/coach");
  if (rounded > 0) {
    writeCoachScrollY(rounded, "/coach");
  } else if (existing !== null && existing > 0) {
    writeCoachScrollY(existing, "/coach");
  } else {
    writeCoachScrollY(0, "/coach");
  }
  setCoachScrollLeaveCaptureLock(true);
}

/** Clears pathname-keyed coach scroll offsets (demo persona switch / sign-in). */
export function clearAllCoachScrollY(): void {
  try {
    const prefix = `${COACH_SCROLL_STORAGE_KEY}:`;
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key !== null && key.startsWith(prefix)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
}
