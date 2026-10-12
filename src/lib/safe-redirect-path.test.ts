import { describe, expect, it } from "vitest";

import {
  SAFE_REDIRECT_FALLBACK,
  sanitizeRedirectPath,
  searchOrHashContainsUnsafeCharacters,
} from "@/lib/safe-redirect-path";

describe("sanitizeRedirectPath", () => {
  it("allows normal app paths", () => {
    expect(sanitizeRedirectPath("/coach")).toBe("/coach");
    expect(sanitizeRedirectPath("/coach?x=1")).toBe("/coach?x=1");
    expect(sanitizeRedirectPath("/coach?q=a%20b")).toBe("/coach?q=a%20b");
  });

  it("rejects open redirects", () => {
    expect(sanitizeRedirectPath("//evil.com")).toBe(SAFE_REDIRECT_FALLBACK);
    expect(sanitizeRedirectPath("/\\evil.com")).toBe(SAFE_REDIRECT_FALLBACK);
    expect(sanitizeRedirectPath("https://evil.com")).toBe(SAFE_REDIRECT_FALLBACK);
    expect(sanitizeRedirectPath("javascript:alert(1)")).toBe(
      SAFE_REDIRECT_FALLBACK,
    );
  });

  it("rejects control characters and whitespace in the pathname", () => {
    for (const malicious of [
      "/\t/evil.com",
      "/\n/evil.com",
      "/\r/evil.com",
      "/ /evil.com",
      "/%09/evil.com",
      "/coach%09/evil",
      "/%252F%252Fevil.com",
    ]) {
      expect(sanitizeRedirectPath(malicious)).toBe(SAFE_REDIRECT_FALLBACK);
    }
  });

  it("flags encoded tab in query via searchOrHashContainsUnsafeCharacters", () => {
    expect(searchOrHashContainsUnsafeCharacters("?next=%09")).toBe(true);
  });

  it("rejects control characters in the query string", () => {
    expect(sanitizeRedirectPath("/coach?next=%09")).toBe(SAFE_REDIRECT_FALLBACK);
    expect(sanitizeRedirectPath("/coach?next=%0d%0a")).toBe(
      SAFE_REDIRECT_FALLBACK,
    );
    expect(sanitizeRedirectPath("/coach?next=\r\n")).toBe(SAFE_REDIRECT_FALLBACK);
    expect(sanitizeRedirectPath("/coach?q=a%0d%0aSet-Cookie:x")).toBe(
      SAFE_REDIRECT_FALLBACK,
    );
    expect(sanitizeRedirectPath("/coach?q=a%20b")).toBe("/coach?q=a%20b");
  });
});
