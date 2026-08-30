import {
  SEED_ASSIGNMENT_IDS,
  SEED_CLERK_IDS,
  SEED_PLAN,
  SEED_VENDOR_IDS,
  SEED_VENDORS,
} from "../../convex/seedPlan";
import { categoriesForStage } from "../../convex/lib/vendors";
import { SEED_TRANSACTION_IDS } from "@/lib/test-session";

export type SeedVendor = (typeof SEED_VENDORS)[number];

export type ListedSeedVendor = {
  id: string;
  category: SeedVendor["category"];
  name: string;
  contact: SeedVendor["contact"];
  notes: string;
  credentials: string;
  compensationModel: "none";
};

export function listSeedVendors(): ListedSeedVendor[] {
  return SEED_VENDORS.map((vendor) => ({
    id: vendor.id,
    category: vendor.category,
    name: vendor.name,
    contact: vendor.contact,
    notes: vendor.notes,
    credentials: vendor.credentials,
    compensationModel: "none",
  }));
}

export function seedVendorsForStage(stage: string): ListedSeedVendor[] {
  const wanted = new Set<string>(categoriesForStage(stage));
  return listSeedVendors().filter((vendor) => wanted.has(vendor.category));
}

export function seedVendorById(vendorId: string) {
  return listSeedVendors().find((vendor) => vendor.id === vendorId) ?? null;
}

export function seedLenderVendor() {
  return seedVendorById(SEED_VENDOR_IDS.lender);
}

export function seedLenderAssignment() {
  return {
    assignmentId: SEED_ASSIGNMENT_IDS.lenderAlex,
    vendorId: SEED_VENDOR_IDS.lender,
    vendorName: SEED_PLAN.lender.name,
    category: "lenders" as const,
    scope: "preapproval",
    status: "active" as const,
    expiresAt: Date.UTC(2026, 9, 30),
    compensationModel: "none" as const,
    transaction: {
      transactionId: SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerA],
      stage: "inspection",
      status: "active",
      propertyCity: "Huntsville",
      propertyState: "AL",
    },
  };
}

export type SeedAssignment = ReturnType<typeof seedLenderAssignment>;
