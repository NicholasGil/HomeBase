import {
  coachScrollEnterSaveBlocked,
  syncCoachScrollEpochFromCookie,
  syncCoachScrollEpochFromCookieWithMeta,
} from "@/lib/coach-scroll-epoch";
import { DEMO_COACH_SCROLL_RESET_COOKIE } from "@/lib/demo-coach-scroll-reset";
import { coachScrollStorageKey } from "@/lib/coach-scroll-key";

/** Persist on pointerdown/pagehide leave; scrollY=0 during nav keeps last depth (no spurious clobber). */
export function coachScrollYForLeavePersist(
  scrollY: number,
  lastCoachScrollY: number,
): number {
  const y =
    scrollY > 0
      ? Math.max(scrollY, lastCoachScrollY)
      : lastCoachScrollY;
  return Math.max(0, Math.round(y));
}

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

/** Sync epoch from server enter; scroll to top once when reset cookie is present. */
export function applyDemoCoachScrollResetFromCookie(): boolean {
  return applyCoachPersonaEnterClear("/coach").cleared;
}

/**
 * Persona enter (/demo/enter, /test-login): sync epoch + consume reset cookie before restore.
 * Must run in bootstrap or the first coach layout effect (not a deferred useEffect).
 */
export function applyCoachPersonaEnterClear(pathname: string): {
  cleared: boolean;
  epochChanged: boolean;
} {
  const sync = syncCoachScrollEpochFromCookieWithMeta();
  const hadResetCookie = documentHasDemoCoachScrollResetCookie();
  if (!hadResetCookie && !sync.changed) {
    return { cleared: false, epochChanged: false };
  }
  if (hadResetCookie) {
    try {
      document.cookie = `${DEMO_COACH_SCROLL_RESET_COOKIE}=; Max-Age=0; path=/`;
    } catch {
      // ignore
    }
  }
  writeCoachScrollY(0, pathname);
  return { cleared: true, epochChanged: sync.changed };
}

export function normalizeCoachNavPath(path: string): string {
  const base = path.split("?")[0]?.split("#")[0] ?? path;
  return base.length > 1 && base.endsWith("/") ? base.slice(0, -1) : base;
}

/** Tab-bar taps on the active route must not arm leave capture. */
export function coachNavLinkLeavesPath(
  href: string | null,
  currentPathname: string,
): boolean {
  if (href === null || !href.startsWith("/")) {
    return false;
  }
  const target = normalizeCoachNavPath(href);
  const current = normalizeCoachNavPath(currentPathname);
  return target !== current;
}
