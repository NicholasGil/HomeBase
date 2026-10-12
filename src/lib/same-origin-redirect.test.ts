import { describe, expect, it } from "vitest";

import { SAFE_REDIRECT_FALLBACK } from "@/lib/safe-redirect-path";
import { redirectToPathFromRequestUrl } from "@/lib/same-origin-redirect";

describe("redirectToPathFromRequestUrl", () => {
  const request = new Request("https://realtyrise.app/demo/enter/buyer-coach");

  it("uses a root-relative Location header on the request host", async () => {
    const response = redirectToPathFromRequestUrl("/coach", request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/coach");
  });

  it("preserves query on the destination path", () => {
    const response = redirectToPathFromRequestUrl(
      "/coach?simulateConciergeServerError=1",
      new Request("http://127.0.0.1:3000/demo/enter/buyer-coach"),
    );
    expect(response.headers.get("location")).toBe(
      "/coach?simulateConciergeServerError=1",
    );
  });

  it("rejects open redirects", () => {
    for (const malicious of [
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      "/\t/evil.com",
      "/\n/evil.com",
      "/\r/evil.com",
      "/ /evil.com",
      "/%09/evil.com",
      "/%09%09/evil.com",
    ]) {
      const response = redirectToPathFromRequestUrl(malicious, request);
      expect(response.headers.get("location")).toBe(SAFE_REDIRECT_FALLBACK);
    }
  });
});
