import { isDemoMode, type AuthEnv } from "@/lib/auth-config";
import { DISPLAY_TIME_ZONE } from "../../convex/lib/displayTime";
import { SEED_CONCIERGE } from "../../convex/seedPlan";

const DAY_MS = 86_400_000;

/** Days from “today” (Chicago) until the demo inspection appointment. */
export const DEMO_INSPECTION_DAYS_AHEAD = 3;

/** Canonical gap: first showing is three Chicago days before inspection. */
const SHOWING_DAYS_BEFORE_INSPECTION = 3;

/** Lender assignment expiry horizon in public demo. */
const DEMO_LENDER_EXPIRY_DAYS_AHEAD = 45;

type ChicagoParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/** Node 20 ICU may format midnight as hour 24 instead of 00. */
export function normalizeChicagoHour(hour: number): number {
  return hour === 24 ? 0 : hour;
}

function chicagoParts(at: number): ChicagoParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(at).map((part) => [part.type, part.value]),
  );
  return {
    year: Number.parseInt(parts.year ?? "0", 10),
    month: Number.parseInt(parts.month ?? "0", 10),
    day: Number.parseInt(parts.day ?? "0", 10),
    hour: normalizeChicagoHour(Number.parseInt(parts.hour ?? "0", 10)),
    minute: Number.parseInt(parts.minute ?? "0", 10),
  };
}

/** UTC instant for a Chicago local wall time (handles DST). */
export function chicagoLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const targetHour = normalizeChicagoHour(hour);
  const probe = Date.UTC(year, month - 1, day, 12, 0, 0);
  for (let offsetMs = -40 * 3_600_000; offsetMs <= 40 * 3_600_000; offsetMs += 60_000) {
    const candidate = probe + offsetMs;
    const local = chicagoParts(candidate);
    if (
      local.year === year &&
      local.month === month &&
      local.day === day &&
      local.hour === targetHour &&
      local.minute === minute
    ) {
      return candidate;
    }
  }
  throw new Error("chicagoLocalToUtc: no match");
}

function addChicagoCalendarDays(
  year: number,
  month: number,
  day: number,
  deltaDays: number,
): Pick<ChicagoParts, "year" | "month" | "day"> {
  const anchor = chicagoLocalToUtc(year, month, day, 12, 0);
  const shifted = chicagoParts(anchor + deltaDays * DAY_MS);
  return { year: shifted.year, month: shifted.month, day: shifted.day };
}

export function fixtureConciergeInspectionAt(
  env: AuthEnv = process.env,
  now = Date.now(),
): number {
  if (!isDemoMode(env)) {
    return SEED_CONCIERGE.inspectionStartsAt;
  }
  const canonical = chicagoParts(SEED_CONCIERGE.inspectionStartsAt);
  const today = chicagoParts(now);
  const target = addChicagoCalendarDays(
    today.year,
    today.month,
    today.day,
    DEMO_INSPECTION_DAYS_AHEAD,
  );
  return chicagoLocalToUtc(
    target.year,
    target.month,
    target.day,
    canonical.hour,
    canonical.minute,
  );
}

export function fixtureConciergeShowingAt(
  env: AuthEnv = process.env,
  now = Date.now(),
): number {
  if (!isDemoMode(env)) {
    return SEED_CONCIERGE.showingStartsAt;
  }
  const inspectionAt = fixtureConciergeInspectionAt(env, now);
  const showCanon = chicagoParts(SEED_CONCIERGE.showingStartsAt);
  const inspDay = chicagoParts(inspectionAt);
  const showDay = addChicagoCalendarDays(
    inspDay.year,
    inspDay.month,
    inspDay.day,
    -SHOWING_DAYS_BEFORE_INSPECTION,
  );
  return chicagoLocalToUtc(
    showDay.year,
    showDay.month,
    showDay.day,
    showCanon.hour,
    showCanon.minute,
  );
}

/** Start of the current Chicago calendar day (UTC instant). */
export function fixtureOwedTodayAsOf(
  env: AuthEnv = process.env,
  now = Date.now(),
): number {
  if (!isDemoMode(env)) {
    return 0;
  }
  const today = chicagoParts(now);
  return chicagoLocalToUtc(today.year, today.month, today.day, 0, 0);
}

export function fixtureInspectionDeadlineAt(
  env: AuthEnv = process.env,
  now = Date.now(),
): number {
  if (!isDemoMode(env)) {
    return 0;
  }
  const inspectionAt = fixtureConciergeInspectionAt(env, now);
  const day = chicagoParts(inspectionAt);
  return chicagoLocalToUtc(day.year, day.month, day.day, 23, 59);
}

export function fixtureLenderExpiresAt(
  env: AuthEnv = process.env,
  now = Date.now(),
): number {
  if (!isDemoMode(env)) {
    return Date.UTC(2026, 9, 30);
  }
  return now + DEMO_LENDER_EXPIRY_DAYS_AHEAD * DAY_MS;
}

/** Upcoming Saturday (Chicago), start of day — tour builder anchor in demo. */
export function fixtureTourDayUtc(
  env: AuthEnv = process.env,
  now = Date.now(),
): number {
  if (!isDemoMode(env)) {
    return Date.UTC(2026, 8, 12);
  }
  const today = chicagoParts(now);
  let cursor = chicagoLocalToUtc(today.year, today.month, today.day, 12, 0);
  for (let i = 0; i < 14; i += 1) {
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: DISPLAY_TIME_ZONE,
      weekday: "short",
    }).format(cursor);
    if (weekday === "Sat") {
      const day = chicagoParts(cursor);
      return chicagoLocalToUtc(day.year, day.month, day.day, 0, 0);
    }
    cursor += DAY_MS;
  }
  throw new Error("fixtureTourDayUtc: no Saturday within 14 days");
}
