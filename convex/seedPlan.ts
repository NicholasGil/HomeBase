export const REQUIRED_P0_TABLES = [
  "orgs",
  "users",
  "memberships",
  "clients",
  "transactions",
  "journeyStages",
  "tasks",
  "auditLog",
] as const;

export const SEED_CLERK_IDS = {
  buyerA: "clerk_buyer_a",
  buyerB: "clerk_buyer_b",
  agent: "clerk_agent",
  lender: "clerk_lender",
} as const;

type SeedDefaultTask = {
  title: string;
  assigneeRole: "buyer" | "agent" | "broker" | "admin" | "vendor";
  blocksStage: boolean;
};

const STAGE_REQUIRED_DOCUMENTS: Record<string, string[]> = {
  financing: ["preapproval"],
  under_contract: ["purchase_agreement", "earnest_money"],
  inspection: ["inspection_report", "repair_request"],
};

const STAGE_DEFAULT_TASKS: Record<string, SeedDefaultTask[]> = {
  financing: [
    {
      title: "Send lender documents",
      assigneeRole: "buyer",
      blocksStage: true,
    },
  ],
  showings: [
    {
      title: "Tour Saturday listings",
      assigneeRole: "buyer",
      blocksStage: false,
    },
  ],
  under_contract: [
    {
      title: "Sign purchase agreement",
      assigneeRole: "agent",
      blocksStage: true,
    },
    {
      title: "Submit earnest money",
      assigneeRole: "buyer",
      blocksStage: true,
    },
  ],
  inspection: [
    {
      title: "Schedule inspection",
      assigneeRole: "agent",
      blocksStage: true,
    },
    {
      title: "Review inspection report",
      assigneeRole: "buyer",
      blocksStage: true,
    },
  ],
  appraisal: [
    {
      title: "Order appraisal",
      assigneeRole: "agent",
      blocksStage: true,
    },
  ],
};

export const SEED_PLAN = {
  org: {
    name: "Lookout Realty",
    state: "AL",
  },
  agent: {
    clerkId: SEED_CLERK_IDS.agent,
    email: "casey.holt@example.com",
    name: "Casey Holt",
    phone: "256-555-0100",
  },
  lender: {
    clerkId: SEED_CLERK_IDS.lender,
    email: "jordan.hale@example.com",
    name: "Jordan Hale",
    phone: "256-555-0199",
  },
  buyers: [
    {
      clerkId: SEED_CLERK_IDS.buyerA,
      email: "alex.rivera@example.com",
      name: "Alex Rivera",
      phone: "256-555-0101",
      stage: "inspection",
      property: {
        line1: "814 Maple Ave",
        city: "Huntsville",
        state: "AL",
        postalCode: "35801",
      },
      owedToday: {
        amountCents: 45000,
        currency: "USD" as const,
        provenance: "title_issued" as const,
        label: "Inspection invoice due today",
      },
    },
    {
      clerkId: SEED_CLERK_IDS.buyerB,
      email: "blair.chen@example.com",
      name: "Blair Chen",
      phone: "256-555-0102",
      stage: "showings",
      property: {
        line1: "22 Cedar Trail",
        city: "Madison",
        state: "AL",
        postalCode: "35758",
      },
      owedToday: {
        amountCents: 0,
        currency: "USD" as const,
        provenance: "user_entered" as const,
        label: "Nothing due today",
      },
    },
  ],
  stages: [
    { key: "discovery", label: "Discovery", order: 1 },
    { key: "financing", label: "Financing", order: 2 },
    { key: "favorites", label: "Favorites", order: 3 },
    { key: "showings", label: "Showings", order: 4 },
    { key: "offer", label: "Offer", order: 5 },
    { key: "negotiation", label: "Negotiation", order: 6 },
    { key: "under_contract", label: "Under Contract", order: 7 },
    { key: "inspection", label: "Inspection", order: 8 },
    { key: "appraisal", label: "Appraisal", order: 9 },
    { key: "title", label: "Title", order: 10 },
    { key: "final_walkthrough", label: "Final Walkthrough", order: 11 },
    { key: "closing", label: "Closing", order: 12 },
    { key: "move_in", label: "Move-In", order: 13 },
  ].map((stage) => ({
    ...stage,
    defaultTasks: STAGE_DEFAULT_TASKS[stage.key] ?? [],
    requiredDocuments: STAGE_REQUIRED_DOCUMENTS[stage.key] ?? [],
  })),
} as const;

export type SeedBuyer = (typeof SEED_PLAN.buyers)[number];

export const SEED_CONCIERGE = {
  inspectionStartsAt: Date.UTC(2026, 8, 8, 15, 0, 0),
  showingStartsAt: Date.UTC(2026, 8, 5, 19, 0, 0),
  originalOfferCents: 42000000,
  counterOfferCents: 43000000,
  lenderName: "Jordan Hale",
} as const;

/** Saturday 12 Sep 2026. CDT is UTC-5, so 10:00 CDT = 15:00 UTC. */
function cdtOnTourSaturday(hour: number, minute = 0) {
  return Date.UTC(2026, 8, 12, hour + 5, minute, 0);
}

export const SEED_TOUR_PROPERTY_IDS = {
  oakwood: "seed-listing-oakwood",
  madison: "seed-listing-madison",
  harvest: "seed-listing-harvest",
  decatur: "seed-listing-decatur",
} as const;

export const SEED_TOUR = {
  date: Date.UTC(2026, 8, 12),
  timezone: "America/Chicago",
  bufferMinutes: 10,
  appointmentLengthMinutes: 45,
  departureNoticeMinutes: 30,
  origin: {
    label: "Lookout Realty office",
    address: {
      line1: "200 Church St NW",
      city: "Huntsville",
      state: "AL",
      postalCode: "35801",
    },
    coordinates: { lat: 34.7308, lng: -86.5861 },
  },
  buyerWindows: [
    { startsAt: cdtOnTourSaturday(9), endsAt: cdtOnTourSaturday(18) },
  ],
  agentWindows: [
    { startsAt: cdtOnTourSaturday(9), endsAt: cdtOnTourSaturday(18) },
  ],
  propertyWindows: [
    { startsAt: cdtOnTourSaturday(10), endsAt: cdtOnTourSaturday(17) },
  ],
  properties: [
    {
      id: SEED_TOUR_PROPERTY_IDS.oakwood,
      address: {
        line1: "4101 Oakwood Ave",
        city: "Huntsville",
        state: "AL",
        postalCode: "35801",
      },
      coordinates: { lat: 34.73037, lng: -86.5861 },
      specs: { beds: 3, baths: 2, sqft: 1680 },
      brief: "Downtown bungalow two blocks from the square. Sample listing.",
    },
    {
      id: SEED_TOUR_PROPERTY_IDS.madison,
      address: {
        line1: "88 Legacy Dr",
        city: "Madison",
        state: "AL",
        postalCode: "35758",
      },
      coordinates: { lat: 34.69926, lng: -86.74833 },
      specs: { beds: 4, baths: 3, sqft: 2420 },
      brief: "Madison subdivision with a two-car garage. Sample listing.",
    },
    {
      id: SEED_TOUR_PROPERTY_IDS.harvest,
      address: {
        line1: "212 Nick Fitcheard Rd",
        city: "Harvest",
        state: "AL",
        postalCode: "35749",
      },
      coordinates: { lat: 34.85564, lng: -86.75083 },
      specs: { beds: 4, baths: 2, sqft: 2100 },
      brief: "Harvest ranch on a half acre. Sample listing.",
    },
    {
      id: SEED_TOUR_PROPERTY_IDS.decatur,
      address: {
        line1: "701 6th Ave SE",
        city: "Decatur",
        state: "AL",
        postalCode: "35601",
      },
      coordinates: { lat: 34.60593, lng: -86.98334 },
      specs: { beds: 3, baths: 2, sqft: 1900 },
      brief: "Decatur craftsman near the river. Longest hop on this loop. Sample listing.",
    },
  ],
} as const;
