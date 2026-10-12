import { isCoachScrollPath } from "@/lib/coach-scroll-bootstrap-logic";
import {
  coachScrollEnterSaveBlocked,
  syncCoachScrollEpochFromCookie,
} from "@/lib/coach-scroll-epoch";
import {
  resolveLeaveCaptureYOffset,
} from "@/lib/coach-scroll-leave-capture";
import { DEMO_COACH_SCROLL_RESET_COOKIE } from "@/lib/demo-coach-scroll-reset";
import {
  COACH_SCROLL_STORAGE_KEY,
  coachScrollStorageKey,
} from "@/lib/coach-scroll-key";

export function readCoachScrollY(pathname: string): number | null {
  syncCoachScrollEpochFromCookie();
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
  if (coachScrollEnterSaveBlocked()) {
    return;
  }
  syncCoachScrollEpochFromCookie();
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
  if (coachScrollEnterSaveBlocked()) {
    return;
  }
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
  if (coachScrollEnterSaveBlocked()) {
    return;
  }
  syncCoachScrollEpochFromCookie();
  const existing = readCoachScrollY("/coach");
  writeCoachScrollY(resolveLeaveCaptureYOffset(y, existing), "/coach");
  setCoachScrollLeaveCaptureLock(true);
}

export function documentHasDemoCoachScrollResetCookie(): boolean {
  try {
    return document.cookie
      .split(";")
      .some((part) =>
        part.trim().startsWith(`${DEMO_COACH_SCROLL_RESET_COOKIE}=`),
      );
  } catch {
    return false;
  }
}

/** Sync epoch from server enter + scroll coach to top when reset cookie is set. */
export function applyDemoCoachScrollResetFromCookie(): boolean {
  syncCoachScrollEpochFromCookie();
  if (!documentHasDemoCoachScrollResetCookie()) {
    return false;
  }
  setCoachScrollLeaveCaptureLock(false);
  try {
    document.cookie = `${DEMO_COACH_SCROLL_RESET_COOKIE}=; Max-Age=0; path=/`;
  } catch {
    // ignore
  }
  return true;
}

/** Removes coach scroll keys for all epochs (maintenance / tests). */
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
