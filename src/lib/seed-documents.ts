import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";
import { SEED_TRANSACTION_IDS } from "@/lib/test-session";

export const SEED_DOCUMENT_IDS = {
  preapproval: "seed-doc-preapproval",
  inspection: "seed-doc-inspection",
  purchaseAgreementClosed: "seed-doc-closing-purchase",
  closingDisclosure: "seed-doc-closing-disclosure",
  hvacWarranty: "seed-doc-hvac-warranty",
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
  [SEED_DOCUMENT_IDS.purchaseAgreementClosed]: {
    id: SEED_DOCUMENT_IDS.purchaseAgreementClosed,
    transactionId: SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerH],
    type: "purchase_agreement",
    title: "Recorded purchase agreement",
    extractedSummary: "Recorded contract for the Carlton Drive close.",
    ownerClerkId: SEED_CLERK_IDS.buyerH,
  },
  [SEED_DOCUMENT_IDS.closingDisclosure]: {
    id: SEED_DOCUMENT_IDS.closingDisclosure,
    transactionId: SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerH],
    type: "closing_disclosure",
    title: "Closing disclosure",
    extractedSummary: "Title issued a $405,000 purchase price at close.",
    ownerClerkId: SEED_CLERK_IDS.buyerH,
  },
  [SEED_DOCUMENT_IDS.hvacWarranty]: {
    id: SEED_DOCUMENT_IDS.hvacWarranty,
    transactionId: SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerH],
    type: "hvac_warranty",
    title: "HVAC warranty",
    extractedSummary: "Five-year compressor coverage from Bluff City Air.",
    ownerClerkId: SEED_CLERK_IDS.buyerH,
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
    value === SEED_DOCUMENT_IDS.inspection ||
    value === SEED_DOCUMENT_IDS.purchaseAgreementClosed ||
    value === SEED_DOCUMENT_IDS.closingDisclosure ||
    value === SEED_DOCUMENT_IDS.hvacWarranty
  );
}

export function seedDocumentTitle(type: string) {
  if (type === "preapproval") {
    return "Preapproval letter";
  }
  if (type === "inspection_report") {
    return "Inspection report";
  }
  if (type === "closing_disclosure") {
    return "Closing disclosure";
  }
  if (type === "hvac_warranty") {
    return "HVAC warranty";
  }
  if (type === "purchase_agreement") {
    return "Purchase agreement";
  }
  return type;
}
