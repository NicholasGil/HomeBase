import { describe, expect, it } from "vitest";

import {
  SAFE_REDIRECT_FALLBACK,
  sanitizeRedirectPath,
} from "@/lib/safe-redirect-path";

describe("sanitizeRedirectPath", () => {
  it("allows normal app paths", () => {
    expect(sanitizeRedirectPath("/coach")).toBe("/coach");
    expect(sanitizeRedirectPath("/coach?x=1")).toBe("/coach?x=1");
  });

  it("rejects open redirects", () => {
    expect(sanitizeRedirectPath("//evil.com")).toBe(SAFE_REDIRECT_FALLBACK);
    expect(sanitizeRedirectPath("/\\evil.com")).toBe(SAFE_REDIRECT_FALLBACK);
    expect(sanitizeRedirectPath("https://evil.com")).toBe(SAFE_REDIRECT_FALLBACK);
    expect(sanitizeRedirectPath("javascript:alert(1)")).toBe(
      SAFE_REDIRECT_FALLBACK,
    );
  });

  it("rejects control characters and whitespace in the path", () => {
    for (const malicious of [
      "/\t/evil.com",
      "/\n/evil.com",
      "/\r/evil.com",
      "/ /evil.com",
      "/%09/evil.com",
      "/coach%09/evil",
      "/coach?next=%09",
    ]) {
      expect(sanitizeRedirectPath(malicious)).toBe(SAFE_REDIRECT_FALLBACK);
    }
  });
});
