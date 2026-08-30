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
