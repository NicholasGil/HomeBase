import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";
import { SEED_TRANSACTION_IDS } from "@/lib/test-session";
import type { SeedAssignment } from "@/lib/seed-vendors";

const STAGE_LABELS: Record<string, string> = {
  inspection: "Inspection",
  financing: "Financing",
  showings: "Showings",
  under_contract: "Under contract",
};

export function fixtureVendorFileLabel(assignment: SeedAssignment): string {
  if (
    assignment.transaction.transactionId ===
    SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerA]
  ) {
    const property = SEED_PLAN.buyers.find(
      (buyer) => buyer.clerkId === SEED_CLERK_IDS.buyerA,
    )?.property;
    if (property) {
      return `${property.line1}, ${property.city}, ${property.state}`;
    }
  }
  const { propertyCity, propertyState } = assignment.transaction;
  return `${propertyCity}, ${propertyState}`;
}

export function fixtureVendorStageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage.replaceAll("_", " ");
}

export function formatFixtureVendorExpiry(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(ms));
}

export function fixtureVendorTaskLabel(scope: string): string {
  if (scope === "loan_commitment") {
    return "Confirm loan commitment";
  }
  if (scope === "inspection_report") {
    return "Inspection report";
  }
  if (scope === "preapproval") {
    return "Pre-approval letter";
  }
  return scope.replaceAll("_", " ");
}

export function fixtureVendorDocumentType(scope: string): string {
  if (scope === "loan_commitment") {
    return "loan_commitment";
  }
  if (scope === "inspection_report") {
    return "inspection_report";
  }
  return "preapproval";
}

export function fixtureVendorDocumentButtonLabel(scope: string): string {
  if (scope === "loan_commitment") {
    return "Upload appraisal";
  }
  if (scope === "inspection_report") {
    return "Request inspection report";
  }
  return "Request preapproval";
}
