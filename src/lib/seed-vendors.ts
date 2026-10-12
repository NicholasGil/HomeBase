import {
  SEED_ASSIGNMENT_IDS,
  SEED_CLERK_IDS,
  SEED_PLAN,
  SEED_VENDOR_IDS,
  SEED_VENDORS,
} from "../../convex/seedPlan";
import { categoriesForStage } from "../../convex/lib/vendors";
import { isDemoMode, type AuthEnv } from "@/lib/auth-config";
import { fixtureLenderExpiresAt } from "@/lib/demo-fixture-dates";
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

export function seedLenderAssignment(env: AuthEnv = process.env) {
  const demo = isDemoMode(env);
  return {
    assignmentId: SEED_ASSIGNMENT_IDS.lenderAlex,
    vendorId: SEED_VENDOR_IDS.lender,
    vendorName: SEED_PLAN.lender.name,
    category: "lenders" as const,
    scope: demo ? ("loan_commitment" as const) : ("preapproval" as const),
    status: "active" as const,
    expiresAt: fixtureLenderExpiresAt(env),
    compensationModel: "none" as const,
    transaction: {
      transactionId: SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerA],
      stage: "inspection",
      status: "active",
      propertyCity: "Huntsville",
      propertyState: "AL",
      ...(demo ? { propertyLine1: "814 Maple Ave" as const } : {}),
    },
  };
}

export type SeedAssignment = ReturnType<typeof seedLenderAssignment>;
