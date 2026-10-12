import { describe, expect, it } from "vitest";

import { isDemoEnterPrefetchRequest } from "@/lib/demo-enter-prefetch";

describe("isDemoEnterPrefetchRequest", () => {
  it("detects Purpose and Next router prefetch headers", () => {
    expect(
      isDemoEnterPrefetchRequest(
        new Request("http://localhost/demo/enter/buyer-coach", {
          headers: { Purpose: "prefetch" },
        }),
      ),
    ).toBe(true);
    expect(
      isDemoEnterPrefetchRequest(
        new Request("http://localhost/demo/enter/buyer-coach", {
          headers: { "Next-Router-Prefetch": "1" },
        }),
      ),
    ).toBe(true);
    expect(
      isDemoEnterPrefetchRequest(
        new Request("http://localhost/demo/enter/buyer-coach"),
      ),
    ).toBe(false);
  });
});
