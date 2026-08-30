import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";
import { SEED_TRANSACTION_IDS } from "@/lib/test-session";

export const SEED_DOCUMENT_IDS = {
  preapproval: "seed-doc-preapproval",
  inspection: "seed-doc-inspection",
} as const;

export type SeedDocumentId =
  (typeof SEED_DOCUMENT_IDS)[keyof typeof SEED_DOCUMENT_IDS];

export type SeedDocument = {
  id: SeedDocumentId;
  transactionId: string;
  type: string;
  title: string;
  extractedSummary: string;
  ownerClerkId: string;
};

export const SEED_DOCUMENTS: Record<SeedDocumentId, SeedDocument> = {
  [SEED_DOCUMENT_IDS.preapproval]: {
    id: SEED_DOCUMENT_IDS.preapproval,
    transactionId: SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerA],
    type: "preapproval",
    title: "Preapproval letter",
    extractedSummary:
      "Lender issued a $450,000 preapproval ceiling on this buyer.",
    ownerClerkId: SEED_CLERK_IDS.buyerA,
  },
  [SEED_DOCUMENT_IDS.inspection]: {
    id: SEED_DOCUMENT_IDS.inspection,
    transactionId: SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerA],
    type: "inspection_report",
    title: "Inspection report",
    extractedSummary:
      "Roof and HVAC need service. No structural defects noted.",
    ownerClerkId: SEED_CLERK_IDS.agent,
  },
};

export const SEED_LENDER = {
  clerkId: SEED_CLERK_IDS.lender,
  name: SEED_PLAN.lender.name,
  role: "vendor" as const,
};

export function isSeedDocumentId(value: string): value is SeedDocumentId {
  return (
    value === SEED_DOCUMENT_IDS.preapproval ||
    value === SEED_DOCUMENT_IDS.inspection
  );
}

export function seedDocumentTitle(type: string) {
  if (type === "preapproval") {
    return "Preapproval letter";
  }
  if (type === "inspection_report") {
    return "Inspection report";
  }
  return type;
}
