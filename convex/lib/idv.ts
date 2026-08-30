import { IDV_PROVIDER } from "./validators";

export const IDV_NOT_ENABLED = "IDV_NOT_ENABLED";

export const IDV_HIGH_RISK_ACTIONS = [
  "financial_document",
  "designated_document",
  "account_recovery",
] as const;

export type IdvHighRiskAction = (typeof IDV_HIGH_RISK_ACTIONS)[number];

export const FINANCIAL_DOCUMENT_TYPES = ["preapproval", "earnest_money"] as const;

/**
 * Per-state IDV allowlist keyed on org.state (DESIGN.md M12).
 * Empty until per-state biometric/IDV review. That review is needs-human #1.
 */
export const IDV_STATE_ALLOWLIST: Readonly<Record<string, true>> = {};

export function isFinancialDocumentType(type: string) {
  return (FINANCIAL_DOCUMENT_TYPES as readonly string[]).includes(type);
}

export function isIdvStateAllowed(
  state: string,
  allowlist: Readonly<Record<string, true>> = IDV_STATE_ALLOWLIST,
) {
  return allowlist[state] === true;
}

export function assertIdvAllowed(input: {
  flags: { FLAG_IDV: boolean };
  orgState: string;
  allowlist?: Readonly<Record<string, true>>;
}) {
  if (!input.flags.FLAG_IDV) {
    throw new Error(IDV_NOT_ENABLED);
  }
  if (!isIdvStateAllowed(input.orgState, input.allowlist ?? IDV_STATE_ALLOWLIST)) {
    throw new Error(IDV_NOT_ENABLED);
  }
}

export function idvGating(input: {
  flags: { FLAG_IDV: boolean };
  orgState: string;
  allowlist?: Readonly<Record<string, true>>;
}) {
  const stateAllowed = isIdvStateAllowed(
    input.orgState,
    input.allowlist ?? IDV_STATE_ALLOWLIST,
  );
  return {
    flagOn: input.flags.FLAG_IDV,
    orgState: input.orgState,
    stateAllowed,
    allowed: input.flags.FLAG_IDV && stateAllowed,
    provider: IDV_PROVIDER,
  };
}

export function sandboxIdvProvider() {
  return IDV_PROVIDER;
}
