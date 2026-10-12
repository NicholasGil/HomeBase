import { readCoachScrollEpochSession } from "@/lib/coach-scroll-epoch";

/** Pathname-keyed offsets scoped by demo/test scroll epoch. */
export const COACH_SCROLL_STORAGE_KEY = "realtyrise.coach.scrollY.v1";

export function coachScrollStorageKey(pathname: string): string {
  const epoch = readCoachScrollEpochSession();
  return coachScrollStorageKeyForEpoch(pathname, epoch);
}

export function coachScrollStorageKeyForEpoch(
  pathname: string,
  epoch: string,
): string {
  return `${COACH_SCROLL_STORAGE_KEY}:${epoch}:${pathname}`;
}
