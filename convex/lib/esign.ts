import { CONTRACT_SECTION_IDS } from "./explainContract";
import { ESIGN_PROVIDER } from "./validators";

export const ESIGN_NOT_ENABLED = "ESIGN_NOT_ENABLED";

export const SIGNATURE_FLOW = [
  "prepare",
  "explain",
  "agent_review",
  "buyer_review",
  "verify",
  "sign",
  "audit_trail",
  "storage",
  "complete",
] as const;

export type SignatureFlowStatus = (typeof SIGNATURE_FLOW)[number];

export const DESIGNATED_DOCUMENT_TYPES = ["purchase_agreement"] as const;

export const BROKERAGE_RETENTION_MS = 7 * 365 * 24 * 60 * 60 * 1000;

export function isDesignatedDocumentType(type: string) {
  return (DESIGNATED_DOCUMENT_TYPES as readonly string[]).includes(type);
}

export function nextSignatureStatus(
  current: SignatureFlowStatus,
): SignatureFlowStatus | null {
  const index = SIGNATURE_FLOW.indexOf(current);
  if (index < 0 || index >= SIGNATURE_FLOW.length - 1) {
    return null;
  }
  const next = SIGNATURE_FLOW[index + 1];
  return next ?? null;
}

export function assertExpectedStatus(
  current: SignatureFlowStatus,
  expected: SignatureFlowStatus,
) {
  if (current !== expected) {
    throw new Error("FORBIDDEN");
  }
}

export function assertEsignEnabled(flags: { FLAG_ESIGN: boolean }) {
  if (!flags.FLAG_ESIGN) {
    throw new Error(ESIGN_NOT_ENABLED);
  }
}

export function retentionUntil(signedAt: number) {
  return signedAt + BROKERAGE_RETENTION_MS;
}

export function explainedSectionIdsFromM7() {
  return [...CONTRACT_SECTION_IDS];
}

export function sandboxProvider() {
  return ESIGN_PROVIDER;
}
