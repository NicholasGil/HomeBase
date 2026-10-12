import { describe, expect, it } from "vitest";

import { transactionScrollPopBootstrapScript } from "@/lib/transaction-scroll-pop-bootstrap-script";

describe("transactionScrollPopBootstrapScript", () => {
  it("parses as valid inline script", () => {
    const script = transactionScrollPopBootstrapScript();
    expect(() => {
      new Function(script);
    }).not.toThrow();
  });
});
