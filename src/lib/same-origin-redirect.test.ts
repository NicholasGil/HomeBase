import { describe, expect, it } from "vitest";

import { redirectToPathFromRequestUrl } from "@/lib/same-origin-redirect";

describe("redirectToPathFromRequestUrl", () => {
  it("uses a root-relative Location header on the request host", async () => {
    const response = redirectToPathFromRequestUrl(
      "/coach",
      new Request("https://realtyrise.app/demo/enter/buyer-coach"),
    );
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
});
