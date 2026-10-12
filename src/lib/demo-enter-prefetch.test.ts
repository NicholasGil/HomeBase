import { describe, expect, it } from "vitest";

import { isDemoEnterPrefetchRequest } from "@/lib/demo-enter-prefetch";

describe("isDemoEnterPrefetchRequest", () => {
  it("detects simple Purpose and Next-Router-Prefetch", () => {
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

  it("detects Chrome prerender and private prefetch Sec-Purpose values", () => {
    expect(
      isDemoEnterPrefetchRequest(
        new Request("http://localhost/demo/enter/buyer-coach", {
          headers: { "Sec-Purpose": "prefetch;prerender" },
        }),
      ),
    ).toBe(true);
    expect(
      isDemoEnterPrefetchRequest(
        new Request("http://localhost/demo/enter/buyer-coach", {
          headers: { "Sec-Purpose": "prefetch;anonymous-client-ip" },
        }),
      ),
    ).toBe(true);
  });
});
