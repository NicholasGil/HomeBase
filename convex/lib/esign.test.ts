import { describe, expect, it } from "vitest";

import {
  assertEsignEnabled,
  ESIGN_NOT_ENABLED,
  explainedSectionIdsFromM7,
  isDesignatedDocumentType,
  nextSignatureStatus,
  retentionUntil,
  SIGNATURE_FLOW,
} from "./esign";
import {
  assertSandboxEsignProvider,
  esignKeysNoteForNeedsHuman,
  isLiveEsignProvider,
  sandboxCompleteSign,
  sandboxSendPacket,
} from "./esignSandbox";

describe("esign workflow", () => {
  it("owns the DESIGN.md states in order", () => {
    expect([...SIGNATURE_FLOW]).toEqual([
      "prepare",
      "explain",
      "agent_review",
      "buyer_review",
      "verify",
      "sign",
      "audit_trail",
      "storage",
      "complete",
    ]);
    expect(nextSignatureStatus("prepare")).toBe("explain");
    expect(nextSignatureStatus("storage")).toBe("complete");
    expect(nextSignatureStatus("complete")).toBeNull();
  });

  it("reuses M7 section ids and marks purchase agreements designated", () => {
    expect(explainedSectionIdsFromM7()).toContain("earnest-money");
    expect(isDesignatedDocumentType("purchase_agreement")).toBe(true);
    expect(isDesignatedDocumentType("inspection_report")).toBe(false);
  });

  it("fail-closes provider send when FLAG_ESIGN is off", () => {
    expect(() => assertEsignEnabled({ FLAG_ESIGN: false })).toThrow(
      ESIGN_NOT_ENABLED,
    );
    expect(() => assertEsignEnabled({ FLAG_ESIGN: true })).not.toThrow();
  });

  it("records brokerage retention from the signed timestamp", () => {
    expect(retentionUntil(0)).toBe(7 * 365 * 24 * 60 * 60 * 1000);
  });
});

describe("esign sandbox", () => {
  it("never treats a live provider as allowed", () => {
    expect(isLiveEsignProvider("docusign")).toBe(true);
    expect(isLiveEsignProvider("dropbox_sign")).toBe(true);
    expect(() => assertSandboxEsignProvider("docusign")).toThrow(
      ESIGN_NOT_ENABLED,
    );
    const sent = sandboxSendPacket("pkt_1");
    expect(sent.providerRef).toBe("sandbox:packet:pkt_1");
    expect(sandboxCompleteSign(sent.providerRef).signed).toBe(true);
    expect(() => sandboxCompleteSign("docusign:live")).toThrow(
      ESIGN_NOT_ENABLED,
    );
  });

  it("points missing production keys at needs-human issue 1", () => {
    const note = esignKeysNoteForNeedsHuman();
    expect(note.issue).toBe(1);
    expect(note.detail).toContain("Do not stub");
  });
});
