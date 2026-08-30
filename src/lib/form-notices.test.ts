import { describe, expect, it } from "vitest";

import {
  formNoticeMessage,
  pathWithNotice,
  safeReturnPath,
} from "@/lib/form-notices";

describe("form notices", () => {
  it("maps known codes and rejects an open return path", () => {
    expect(formNoticeMessage("select-listing")).toBe(
      "Select at least one listing.",
    );
    expect(formNoticeMessage("empty-message")).toContain("message");
    expect(formNoticeMessage("unknown")).toBeNull();
    expect(safeReturnPath("/dashboard", "/tours")).toBe("/dashboard");
    expect(safeReturnPath("https://evil.example", "/tours")).toBe("/tours");
    expect(pathWithNotice("/tours", "select-listing")).toBe(
      "/tours?notice=select-listing",
    );
  });
});
