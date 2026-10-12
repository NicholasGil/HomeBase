import {
  coachScrollStorageKey,
  readCoachScrollPersonaKeyFromDocument,
} from "@/lib/coach-scroll-key";

function storageKeyForPath(pathname: string): string {
  return coachScrollStorageKey(
    pathname,
    readCoachScrollPersonaKeyFromDocument(),
  );
}

export function readCoachScrollY(pathname: string): number | null {
  const key = storageKeyForPath(pathname);
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
  const key = storageKeyForPath(pathname);
  try {
    sessionStorage.setItem(key, String(Math.max(0, Math.round(y))));
  } catch {
    // Private mode / quota — ignore.
  }
}
