import { COACH_SCROLL_STORAGE_KEY } from "@/lib/coach-scroll-key";

export function readCoachScrollY(
  key: string = COACH_SCROLL_STORAGE_KEY,
): number | null {
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

export function writeCoachScrollY(
  y: number,
  key: string = COACH_SCROLL_STORAGE_KEY,
): void {
  try {
    sessionStorage.setItem(key, String(Math.max(0, Math.round(y))));
  } catch {
    // Private mode / quota — ignore.
  }
}
