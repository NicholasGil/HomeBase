import {
  hubValueSlots,
  type HomeownershipHubView,
} from "../../convex/lib/homeownership";
import { moneyFigure } from "../../convex/lib/offerModel";
import { postCloseVendorCategories } from "../../convex/lib/vendors";
import {
  SEED_ASSIGNMENT_IDS,
  SEED_CLERK_IDS,
  SEED_HOMEOWNERSHIP,
  SEED_PLAN,
  SEED_VENDOR_IDS,
} from "../../convex/seedPlan";
import { SEED_DOCUMENT_IDS, type SeedDocumentId } from "@/lib/seed-documents";
import { listSeedVendors } from "@/lib/seed-vendors";
import { SEED_TRANSACTION_IDS } from "@/lib/test-session";

const DAY_MS = 86_400_000;
const HUB_AS_OF = Date.UTC(2026, 7, 30, 12, 0, 0);

export const SEED_CLOSED_TRANSACTION_ID =
  SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerH];

export function seedHomeownershipHub(
  now = HUB_AS_OF,
): HomeownershipHubView {
  const buyer = SEED_PLAN.buyers.find(
    (row) => row.clerkId === SEED_HOMEOWNERSHIP.closedClerkId,
  );
  if (buyer === undefined) {
    throw new Error("closed seed buyer missing");
  }
  const wanted = new Set<string>(postCloseVendorCategories());
  const vendors = listSeedVendors()
    .filter(
      (vendor) =>
        wanted.has(vendor.category) || vendor.id === SEED_VENDOR_IDS.hvac,
    )
    .map((vendor) => ({
      vendorId: vendor.id,
      assignmentId:
        vendor.id === SEED_VENDOR_IDS.hvac
          ? SEED_ASSIGNMENT_IDS.hvacIndira
          : null,
      name: vendor.name,
      category: vendor.category,
      compensationModel: "none" as const,
      assignmentStatus:
        vendor.id === SEED_VENDOR_IDS.hvac ? ("complete" as const) : null,
      reengaged: false,
    }));

  return {
    transactionId: SEED_CLOSED_TRANSACTION_ID,
    status: "closed",
    stage: buyer.stage,
    propertyAddress: buyer.property,
    maintenance: SEED_HOMEOWNERSHIP.maintenance.map((item, index) => ({
      id: `seed-maint-${index}`,
      title: item.title,
      category: item.category,
      cadenceDays: item.cadenceDays,
      nextDueAt: now + item.nextDueOffsetDays * DAY_MS,
      status: item.status,
      notes: item.notes,
    })),
    warranties: SEED_HOMEOWNERSHIP.warranties.map((warranty, index) => ({
      id: `seed-warranty-${index}`,
      title: warranty.title,
      provider: warranty.provider,
      coverage: warranty.coverage,
      expiresAt: now + warranty.expiresOffsetDays * DAY_MS,
      documentId:
        warranty.documentType === "hvac_warranty"
          ? SEED_DOCUMENT_IDS.hvacWarranty
          : SEED_DOCUMENT_IDS.closingDisclosure,
    })),
    documents: [
      {
        id: SEED_DOCUMENT_IDS.purchaseAgreementClosed,
        type: "purchase_agreement",
        status: "classified",
      },
      {
        id: SEED_DOCUMENT_IDS.closingDisclosure,
        type: "closing_disclosure",
        status: "summarized",
      },
      {
        id: SEED_DOCUMENT_IDS.hvacWarranty,
        type: "hvac_warranty",
        status: "summarized",
      },
    ],
    values: hubValueSlots({
      issued: moneyFigure({
        amountCents: SEED_HOMEOWNERSHIP.values.issued.amountCents,
        provenance: SEED_HOMEOWNERSHIP.values.issued.provenance,
        asOf: SEED_HOMEOWNERSHIP.asOf,
        label: SEED_HOMEOWNERSHIP.values.issued.label,
      }),
      estimated: moneyFigure({
        amountCents: SEED_HOMEOWNERSHIP.values.estimated.amountCents,
        provenance: SEED_HOMEOWNERSHIP.values.estimated.provenance,
        asOf: SEED_HOMEOWNERSHIP.asOf,
        label: SEED_HOMEOWNERSHIP.values.estimated.label,
      }),
      taxAssessed: null,
    }),
    vendors,
  };
}

export function applyReengage(
  view: HomeownershipHubView,
  vendorId: string,
): HomeownershipHubView {
  return {
    ...view,
    vendors: view.vendors.map((vendor) =>
      vendor.vendorId === vendorId
        ? {
            ...vendor,
            assignmentId: vendor.assignmentId ?? `seed-reengage:${vendorId}`,
            assignmentStatus: "active",
            reengaged: true,
            compensationModel: "none",
          }
        : vendor,
    ),
  };
}

export function isClosedHubDocumentId(
  value: string,
): value is SeedDocumentId {
  return (
    value === SEED_DOCUMENT_IDS.closingDisclosure ||
    value === SEED_DOCUMENT_IDS.hvacWarranty ||
    value === SEED_DOCUMENT_IDS.purchaseAgreementClosed
  );
}
