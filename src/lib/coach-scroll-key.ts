import type { TestSession } from "@/lib/test-session";

export const COACH_SCROLL_STORAGE_KEY = "realtyrise.coach.scrollY.v1";

export const COACH_SCROLL_PERSONA_DATA_ATTR = "data-coach-scroll-persona";

export function coachScrollPersonaKeyForSession(
  session: TestSession | null,
): string {
  if (session === null) {
    return "guest";
  }
  if (session.role === "buyer") {
    const scope = session.emptyCoachFile
      ? "discovery-empty"
      : session.transactionId;
    return `${session.clerkId}:${scope}`;
  }
  return session.role;
}

export function coachScrollStorageKey(
  pathname: string,
  personaKey: string,
): string {
  return `${COACH_SCROLL_STORAGE_KEY}:${personaKey}:${pathname}`;
}

export function readCoachScrollPersonaKeyFromDocument(): string {
  if (typeof document === "undefined") {
    return "guest";
  }
  const value = document.documentElement.getAttribute(
    COACH_SCROLL_PERSONA_DATA_ATTR,
  );
  return value && value.length > 0 ? value : "guest";
}
