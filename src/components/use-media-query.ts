"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string, onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * `true` once the viewport matches `query`. Always `false` on the server and
 * during hydration so the first client render matches the HTML; callers must
 * only branch on it for UI that is not in the initial paint (e.g. a closed
 * sheet) or tolerate one corrective render.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribe(query, onChange),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const MD_UP = "(min-width: 768px)";
