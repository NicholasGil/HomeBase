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
});
