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
