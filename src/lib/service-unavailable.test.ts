import { describe, expect, it } from "vitest";

import { serviceUnavailableResponse } from "@/lib/service-unavailable";

describe("serviceUnavailableResponse", () => {
  it("returns HTTP 503", () => {
    const response = serviceUnavailableResponse();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
