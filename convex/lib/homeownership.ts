import type { MoneyFigure } from "./offerModel";

export const HUB_UNAVAILABLE = "FORBIDDEN";

export const HUB_VALUE_SLOTS = [
  "issuedClose",
  "estimatedMarket",
  "taxAssessed",
] as const;

export type HubValueSlotKey = (typeof HUB_VALUE_SLOTS)[number];

export type HubMaintenanceItem = {
  id: string;
  title: string;
  category: string;
  cadenceDays: number | null;
  nextDueAt: number;
  status: "upcoming" | "due" | "done";
  notes: string | null;
};

export type HubWarranty = {
  id: string;
  title: string;
  provider: string;
  coverage: string | null;
  expiresAt: number | null;
  documentId: string | null;
};

export type HubDocument = {
  id: string;
  type: string;
  status: string;
};

export type HubValueSlot = {
  key: HubValueSlotKey;
  label: string;
  figure: MoneyFigure | null;
};

export type HubVendor = {
  vendorId: string;
  assignmentId: string | null;
  name: string;
  category: string;
  compensationModel: "none";
  assignmentStatus: string | null;
  reengaged: boolean;
};

export type HomeownershipHubView = {
  transactionId: string;
  status: "closed";
  stage: string;
  propertyAddress: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  maintenance: HubMaintenanceItem[];
  warranties: HubWarranty[];
  documents: HubDocument[];
  values: HubValueSlot[];
  vendors: HubVendor[];
};

export function isClosedTransactionStatus(
  status: string,
): status is "closed" {
  return status === "closed";
}

export function assertClosedHub(status: string) {
  if (!isClosedTransactionStatus(status)) {
    throw new Error(HUB_UNAVAILABLE);
  }
}

export function toListedHubDocument(document: {
  _id?: string;
  id?: string;
  type: string;
  status: string;
  extractedSummary?: string;
}): HubDocument {
  const id = document.id ?? document._id;
  if (id === undefined) {
    throw new Error(HUB_UNAVAILABLE);
  }
  return {
    id,
    type: document.type,
    status: document.status,
  };
}

export function hubValueSlots(input: {
  issued: MoneyFigure | null;
  estimated: MoneyFigure | null;
  taxAssessed?: MoneyFigure | null;
}): HubValueSlot[] {
  return [
    {
      key: "issuedClose",
      label: "Issued at close",
      figure: input.issued,
    },
    {
      key: "estimatedMarket",
      label: "Sourced estimate",
      figure: input.estimated,
    },
    {
      key: "taxAssessed",
      label: "Tax assessed",
      figure: input.taxAssessed ?? null,
    },
  ];
}
