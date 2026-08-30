import type { Doc } from "../_generated/dataModel";

import {
  POST_CLOSE_VENDOR_CATEGORIES,
  VENDOR_CATEGORIES,
} from "./validators";

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export const STAGE_VENDOR_CATEGORIES: Record<string, readonly VendorCategory[]> =
  {
    financing: ["lenders"],
    inspection: [
      "inspectors",
      "pest",
      "hvac",
      "plumbing",
      "electrical",
      "roofing",
    ],
    title: ["title", "surveyors"],
    closing: ["insurance"],
    move_in: ["movers", "locksmiths", "cleaners", "internet"],
  };

const LENDER_CATEGORIES = new Set<string>(["lender", "lenders"]);

export function isLenderCategory(category: string) {
  return LENDER_CATEGORIES.has(category);
}

export function categoriesForStage(stage: string): readonly VendorCategory[] {
  return STAGE_VENDOR_CATEGORIES[stage] ?? [];
}

export function postCloseVendorCategories(): readonly VendorCategory[] {
  return POST_CLOSE_VENDOR_CATEGORIES;
}

export function isAssignmentLive(
  assignment: Pick<Doc<"vendorAssignments">, "status" | "expiresAt">,
  now: number,
) {
  return assignment.status === "active" && assignment.expiresAt > now;
}

export function assertCompensationModelWrite(
  flags: { FLAG_VENDOR_COMP: boolean },
  compensationModel: string,
) {
  if (compensationModel === "none") {
    return;
  }
  if (!flags.FLAG_VENDOR_COMP) {
    throw new Error("FORBIDDEN");
  }
  throw new Error("FORBIDDEN");
}

export function toListedVendor(vendor: Doc<"vendors">) {
  return {
    _id: vendor._id,
    category: vendor.category,
    name: vendor.name,
    contact: vendor.contact,
    notes: vendor.notes ?? null,
    credentials: vendor.credentials ?? null,
    compensationModel: "none" as const,
  };
}
