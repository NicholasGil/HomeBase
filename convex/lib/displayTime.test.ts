import { describe, expect, it } from "vitest";

import {
  containsRawIsoDateTime,
  DISPLAY_TIME_ZONE,
  formatDisplayDateTime,
} from "./displayTime";

describe("formatDisplayDateTime", () => {
  it("renders Chicago local time with the daylight zone abbreviation", () => {
    expect(formatDisplayDateTime(Date.UTC(2026, 8, 8, 15, 0, 0))).toBe(
      "Tue, Sep 8, 2026, 10:00 AM CDT",
    );
  });

  it("switches to standard time in winter", () => {
    expect(formatDisplayDateTime(new Date(Date.UTC(2026, 0, 15, 15, 0, 0)))).toBe(
      "Thu, Jan 15, 2026, 9:00 AM CST",
    );
  });

  it("defaults to America/Chicago and honors an explicit zone", () => {
    expect(DISPLAY_TIME_ZONE).toBe("America/Chicago");
    expect(
      formatDisplayDateTime(Date.UTC(2026, 8, 8, 15, 0, 0), "America/New_York"),
    ).toBe("Tue, Sep 8, 2026, 11:00 AM EDT");
  });

  it("never emits a raw ISO-8601 string", () => {
    const text = formatDisplayDateTime(Date.UTC(2026, 8, 5, 19, 0, 0));
    expect(containsRawIsoDateTime(text)).toBe(false);
    expect(text).not.toMatch(/T\d{2}:\d{2}:\d{2}/);
    expect(text).not.toContain("Z");
    expect(text).not.toMatch(/[\u00a0\u202f]/);
  });

  it("flags raw ISO datetimes", () => {
    expect(containsRawIsoDateTime("2026-09-15T14:00:00.000Z")).toBe(true);
    expect(containsRawIsoDateTime("Inspection is at 2026-09-15T14:00Z.")).toBe(
      true,
    );
    expect(containsRawIsoDateTime("Sep 15, 2026, 9:00 AM CDT")).toBe(false);
  });
});
