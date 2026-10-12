import { COACH_SCROLL_STORAGE_KEY } from "@/lib/coach-scroll-key";

export function isCoachScrollPath(pathname: string): boolean {
  return /^\/coach(\/|$)/.test(pathname);
}

export function readCoachScrollYFromStorage(
  storage: Pick<Storage, "getItem">,
  key: string = COACH_SCROLL_STORAGE_KEY,
): number | null {
  try {
    const raw = storage.getItem(key);
    if (raw === null) {
      return null;
    }
    const y = Number.parseInt(raw, 10);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

export function clampCoachScrollTarget(
  y: number,
  scrollHeight: number,
  innerHeight: number,
): number {
  const max = Math.max(0, scrollHeight - innerHeight);
  return Math.min(y, max);
}

export function restoreCoachScrollY(options: {
  pathname: string;
  storage: Pick<Storage, "getItem">;
  scrollTo: (x: number, y: number) => void;
  scrollHeight: number;
  innerHeight: number;
  scrollBehaviorStyle: { scrollBehavior: string };
  key?: string;
}): boolean {
  if (!isCoachScrollPath(options.pathname)) {
    return false;
  }
  const y = readCoachScrollYFromStorage(options.storage, options.key);
  if (y === null || y <= 0) {
    return false;
  }
  const target = clampCoachScrollTarget(
    y,
    options.scrollHeight,
    options.innerHeight,
  );
  options.scrollBehaviorStyle.scrollBehavior = "auto";
  options.scrollTo(0, target);
  return true;
}
