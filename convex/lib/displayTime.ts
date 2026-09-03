export const DISPLAY_TIME_ZONE = "America/Chicago";

const RAW_ISO_DATETIME = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * Formats an instant for buyer-facing text, e.g. "Tue, Sep 8, 2026, 10:00 AM CDT".
 * Always carries the zone abbreviation so the reader knows the clock it refers to.
 */
export function formatDisplayDateTime(
  at: number | Date,
  timeZone: string = DISPLAY_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
    .format(at)
    .replace(/[\u00a0\u202f]/g, " ");
}

export function containsRawIsoDateTime(text: string): boolean {
  return RAW_ISO_DATETIME.test(text);
}
