import { describe, expect, it } from "vitest";

import { coachScrollRestoreOnPageShow } from "@/lib/coach-scroll-pageshow";

describe("coachScrollRestoreOnPageShow", () => {
  it("restores when bfcache persisted on /coach", () => {
    expect(
      coachScrollRestoreOnPageShow({ persisted: true }, "/coach"),
    ).toBe(true);
  });

  it("skips when not persisted", () => {
    expect(
      coachScrollRestoreOnPageShow({ persisted: false }, "/coach"),
    ).toBe(false);
  });

  it("skips off coach routes", () => {
    expect(
      coachScrollRestoreOnPageShow({ persisted: true }, "/search"),
    ).toBe(false);
  });
});
