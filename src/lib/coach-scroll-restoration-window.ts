export const COACH_SCROLL_RESTORATION_ORIGINAL_KEY =
  "__coachScrollRestorationOriginal";

export function recordCoachScrollRestorationOriginal(): void {
  if (typeof window === "undefined") {
    return;
  }
  const bag = window as Window & {
    [COACH_SCROLL_RESTORATION_ORIGINAL_KEY]?: History["scrollRestoration"];
  };
  if (bag[COACH_SCROLL_RESTORATION_ORIGINAL_KEY] === undefined) {
    bag[COACH_SCROLL_RESTORATION_ORIGINAL_KEY] = history.scrollRestoration;
  }
}

export function resetCoachScrollRestorationToAuto(): void {
  try {
    history.scrollRestoration = "auto";
  } catch {
    // ignore
  }
}
