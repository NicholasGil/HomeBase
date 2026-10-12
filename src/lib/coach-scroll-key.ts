export const COACH_SCROLL_STORAGE_KEY = "realtyrise.coach.scrollY.v1";

export function coachScrollStorageKey(pathname: string): string {
  return `${COACH_SCROLL_STORAGE_KEY}:${pathname}`;
}
