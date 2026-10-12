import { describe, expect, it } from "vitest";

import {
  COACH_SCROLL_EPOCH_COOKIE,
  hrefStartsDemoEnter,
  parseCoachScrollEpochCookie,
} from "@/lib/coach-scroll-epoch";

describe("coach scroll epoch", () => {
  it("parses epoch from cookie header", () => {
    expect(
      parseCoachScrollEpochCookie(`${COACH_SCROLL_EPOCH_COOKIE}=1730000000000`),
    ).toBe("1730000000000");
    expect(parseCoachScrollEpochCookie("")).toBe("0");
  });

  it("detects demo chooser and enter links", () => {
    expect(hrefStartsDemoEnter("/demo")).toBe(true);
    expect(hrefStartsDemoEnter("/demo/enter/buyer-discovery")).toBe(true);
    expect(hrefStartsDemoEnter("/coach")).toBe(false);
  });
});
