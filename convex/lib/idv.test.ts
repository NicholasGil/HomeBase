import { describe, expect, it } from "vitest";

import {
  assertIdvAllowed,
  IDV_NOT_ENABLED,
  IDV_STATE_ALLOWLIST,
  idvGating,
  isFinancialDocumentType,
  isIdvStateAllowed,
} from "./idv";
import {
  assertSandboxIdvProvider,
  idvKeysNoteForNeedsHuman,
  isLiveIdvProvider,
  sandboxCompleteIdv,
  sandboxStartIdv,
} from "./idvSandbox";

describe("idv gating", () => {
  it("allows no state until a human reviews the table", () => {
    expect(IDV_STATE_ALLOWLIST).toEqual({});
    expect(isIdvStateAllowed("AL")).toBe(false);
    expect(isIdvStateAllowed("AL", { AL: true })).toBe(true);
  });

  it("rejects high-risk actions when the flag is off or the state is disallowed", () => {
    expect(() =>
      assertIdvAllowed({ flags: { FLAG_IDV: false }, orgState: "AL" }),
    ).toThrow(IDV_NOT_ENABLED);
    expect(() =>
      assertIdvAllowed({ flags: { FLAG_IDV: true }, orgState: "AL" }),
    ).toThrow(IDV_NOT_ENABLED);
    expect(() =>
      assertIdvAllowed({
        flags: { FLAG_IDV: true },
        orgState: "AL",
        allowlist: { AL: true },
      }),
    ).not.toThrow();
  });

  it("treats preapproval as a financial document", () => {
    expect(isFinancialDocumentType("preapproval")).toBe(true);
    expect(isFinancialDocumentType("inspection_report")).toBe(false);
    const gating = idvGating({ flags: { FLAG_IDV: false }, orgState: "AL" });
    expect(gating.allowed).toBe(false);
    expect(gating.stateAllowed).toBe(false);
  });
});

describe("idv sandbox", () => {
  it("never calls a live vendor and only returns a provider ref", () => {
    expect(isLiveIdvProvider("persona")).toBe(true);
    expect(() => assertSandboxIdvProvider("persona")).toThrow(IDV_NOT_ENABLED);
    const started = sandboxStartIdv("sess_1");
    expect(started.providerRef).toBe("sandbox:idv:sess_1");
    expect(sandboxCompleteIdv(started.providerRef).verified).toBe(true);
    expect(idvKeysNoteForNeedsHuman().issue).toBe(1);
  });
});
