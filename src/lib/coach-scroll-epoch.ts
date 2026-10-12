/** Bumped on /demo/enter and fixture sign-in; included in coach scroll storage keys. */
export const COACH_SCROLL_EPOCH_COOKIE = "hb_coach_scroll_epoch";

export const COACH_SCROLL_EPOCH_SESSION_KEY =
  "realtyrise.coach.scrollY.epoch";

/** Set on pointerdown toward /demo or /demo/enter before navigation completes. */
export const COACH_SCROLL_ENTER_STARTED_KEY =
  "realtyrise.coach.scrollY.enterStarted";

export function nextCoachScrollEpoch(): string {
  return String(Date.now());
}

export function coachScrollEpochCookieOptions(
  env: Pick<NodeJS.ProcessEnv, "NODE_ENV"> = process.env,
) {
  return {
    path: "/",
    maxAge: 120,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
  };
}

export function parseCoachScrollEpochCookie(
  cookieHeader: string | undefined,
): string {
  if (cookieHeader === undefined || cookieHeader === "") {
    return "0";
  }
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${COACH_SCROLL_EPOCH_COOKIE}=`)) {
      const value = trimmed.slice(COACH_SCROLL_EPOCH_COOKIE.length + 1);
      return value.length > 0 ? value : "0";
    }
  }
  return "0";
}

export function readCoachScrollEpochFromDocument(): string {
  if (typeof document === "undefined") {
    return "0";
  }
  try {
    return parseCoachScrollEpochCookie(document.cookie);
  } catch {
    return "0";
  }
}

export function readCoachScrollEpochSession(): string {
  if (typeof sessionStorage === "undefined") {
    return "0";
  }
  try {
    const raw = sessionStorage.getItem(COACH_SCROLL_EPOCH_SESSION_KEY);
    return raw !== null && raw.length > 0 ? raw : "0";
  } catch {
    return "0";
  }
}

export type CoachScrollEpochSync = {
  epoch: string;
  /** True when the server bumped hb_coach_scroll_epoch since the last client sync. */
  changed: boolean;
};

/** Apply server-bumped epoch cookie before any coach scroll read/write. */
export function syncCoachScrollEpochFromCookie(): string {
  return syncCoachScrollEpochFromCookieWithMeta().epoch;
}

export function syncCoachScrollEpochFromCookieWithMeta(): CoachScrollEpochSync {
  const previous = readCoachScrollEpochSession();
  const epoch = readCoachScrollEpochFromDocument();
  const changed = epoch !== previous;
  try {
    sessionStorage.setItem(COACH_SCROLL_EPOCH_SESSION_KEY, epoch);
    sessionStorage.removeItem(COACH_SCROLL_ENTER_STARTED_KEY);
  } catch {
    // ignore
  }
  return { epoch, changed };
}

export function coachScrollEnterSaveBlocked(): boolean {
  try {
    return sessionStorage.getItem(COACH_SCROLL_ENTER_STARTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markCoachScrollEnterStarted(): void {
  try {
    sessionStorage.setItem(COACH_SCROLL_ENTER_STARTED_KEY, "1");
  } catch {
    // ignore
  }
}

export function hrefStartsDemoEnter(href: string | null): boolean {
  if (href === null || !href.startsWith("/")) {
    return false;
  }
  const path = href.split("?")[0]?.split("#")[0] ?? href;
  return path === "/demo" || path.startsWith("/demo/enter");
}
