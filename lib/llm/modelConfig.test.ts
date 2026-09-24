import { describe, expect, it } from "vitest";

import {
  conciergeModelKeyLabel,
  conciergeModelKeyPresent,
} from "./modelConfig";

describe("conciergeModelKeyPresent", () => {
  it("is false when no provider key is set", () => {
    expect(conciergeModelKeyPresent({})).toBe(false);
    expect(
      conciergeModelKeyPresent({
        REALTYRISE_MODEL_API_KEY: "",
        OPENAI_API_KEY: "   ",
      }),
    ).toBe(false);
  });

  it("accepts any configured provider env", () => {
    expect(
      conciergeModelKeyPresent({ REALTYRISE_MODEL_API_KEY: "sk-test" }),
    ).toBe(true);
    expect(conciergeModelKeyPresent({ OPENAI_API_KEY: "sk-test" })).toBe(true);
    expect(
      conciergeModelKeyLabel({ AI_GATEWAY_API_KEY: "gw-test" }),
    ).toBe("AI_GATEWAY_API_KEY");
  });
});
