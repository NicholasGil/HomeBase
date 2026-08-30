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
  buyerC: "clerk_buyer_c",
  buyerD: "clerk_buyer_d",
  buyerE: "clerk_buyer_e",
  buyerF: "clerk_buyer_f",
  buyerG: "clerk_buyer_g",
  buyerH: "clerk_buyer_h",
  agent: "clerk_agent",
  lender: "clerk_lender",
} as const;

export type SeedCommandCenterException =
  | "missing_financing_document"
  | "inspection_due_tomorrow";

type SeedBuyerTask = {
  stage: string;
  title: string;
  assigneeRole: "buyer" | "agent" | "broker" | "admin" | "vendor";
  status: "open" | "blocked" | "done" | "canceled";
  blocksStage: boolean;
};

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
      exception: null,
      inspectionDueOffsetDays: null,
      underContractOffsetDays: null,
      closingAtOffsetDays: null,
      documents: ["preapproval", "inspection_report"],
      seedDraftOffer: true,
      prequalStatus: "preapproved" as const,
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
      tasks: [
        {
          stage: "under_contract",
          title: "Sign purchase agreement",
          assigneeRole: "agent",
          status: "done",
          blocksStage: true,
        },
        {
          stage: "under_contract",
          title: "Submit earnest money",
          assigneeRole: "buyer",
          status: "done",
          blocksStage: true,
        },
        {
          stage: "inspection",
          title: "Schedule inspection",
          assigneeRole: "agent",
          status: "open",
          blocksStage: true,
        },
        {
          stage: "inspection",
          title: "Review inspection report",
          assigneeRole: "buyer",
          status: "blocked",
          blocksStage: true,
        },
      ] satisfies SeedBuyerTask[],
    },
    {
      clerkId: SEED_CLERK_IDS.buyerB,
      email: "blair.chen@example.com",
      name: "Blair Chen",
      phone: "256-555-0102",
      stage: "showings",
      exception: null,
      inspectionDueOffsetDays: null,
      underContractOffsetDays: null,
      closingAtOffsetDays: null,
      documents: [],
      seedDraftOffer: false,
      prequalStatus: "preapproved" as const,
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
      tasks: [
        {
          stage: "financing",
          title: "Send lender documents",
          assigneeRole: "buyer",
          status: "done",
          blocksStage: true,
        },
        {
          stage: "showings",
          title: "Tour Saturday listings",
          assigneeRole: "buyer",
          status: "open",
          blocksStage: false,
        },
      ] satisfies SeedBuyerTask[],
    },
    {
      clerkId: SEED_CLERK_IDS.buyerC,
      email: "dana.ortiz@example.com",
      name: "Dana Ortiz",
      phone: "256-555-0103",
      stage: "financing",
      exception: "missing_financing_document" as const,
      inspectionDueOffsetDays: null,
      underContractOffsetDays: null,
      closingAtOffsetDays: null,
      documents: [],
      seedDraftOffer: false,
      prequalStatus: "in_progress" as const,
      property: {
        line1: "90 Pulaski Pike",
        city: "Huntsville",
        state: "AL",
        postalCode: "35810",
      },
      owedToday: {
        amountCents: 0,
        currency: "USD" as const,
        provenance: "user_entered" as const,
        label: "Nothing due today",
      },
      tasks: [
        {
          stage: "financing",
          title: "Send lender documents",
          assigneeRole: "buyer",
          status: "open",
          blocksStage: true,
        },
      ] satisfies SeedBuyerTask[],
    },
    {
      clerkId: SEED_CLERK_IDS.buyerD,
      email: "ellis.park@example.com",
      name: "Ellis Park",
      phone: "256-555-0104",
      stage: "inspection",
      exception: "inspection_due_tomorrow" as const,
      inspectionDueOffsetDays: 1,
      underContractOffsetDays: 5,
      closingAtOffsetDays: null,
      documents: ["inspection_report"],
      seedDraftOffer: false,
      prequalStatus: "preapproved" as const,
      property: {
        line1: "415 Esslinger Dr",
        city: "Huntsville",
        state: "AL",
        postalCode: "35802",
      },
      owedToday: {
        amountCents: 0,
        currency: "USD" as const,
        provenance: "user_entered" as const,
        label: "Nothing due today",
      },
      tasks: [
        {
          stage: "inspection",
          title: "Schedule inspection",
          assigneeRole: "agent",
          status: "done",
          blocksStage: true,
        },
        {
          stage: "inspection",
          title: "Review inspection report",
          assigneeRole: "buyer",
          status: "open",
          blocksStage: true,
        },
      ] satisfies SeedBuyerTask[],
    },
    {
      clerkId: SEED_CLERK_IDS.buyerE,
      email: "fran.okonkwo@example.com",
      name: "Fran Okonkwo",
      phone: "256-555-0105",
      stage: "offer",
      exception: null,
      inspectionDueOffsetDays: null,
      underContractOffsetDays: null,
      closingAtOffsetDays: null,
      documents: ["preapproval"],
      seedDraftOffer: true,
      prequalStatus: "preapproved" as const,
      property: {
        line1: "12 Clinton Ave",
        city: "Huntsville",
        state: "AL",
        postalCode: "35801",
      },
      owedToday: {
        amountCents: 0,
        currency: "USD" as const,
        provenance: "user_entered" as const,
        label: "Nothing due today",
      },
      tasks: [
        {
          stage: "offer",
          title: "Write offer terms",
          assigneeRole: "buyer",
          status: "open",
          blocksStage: false,
        },
      ] satisfies SeedBuyerTask[],
    },
    {
      clerkId: SEED_CLERK_IDS.buyerF,
      email: "gray.patel@example.com",
      name: "Gray Patel",
      phone: "256-555-0106",
      stage: "under_contract",
      exception: null,
      inspectionDueOffsetDays: null,
      underContractOffsetDays: 2,
      closingAtOffsetDays: null,
      documents: ["purchase_agreement"],
      seedDraftOffer: false,
      prequalStatus: "preapproved" as const,
      property: {
        line1: "308 Drake Ave",
        city: "Huntsville",
        state: "AL",
        postalCode: "35801",
      },
      owedToday: {
        amountCents: 0,
        currency: "USD" as const,
        provenance: "user_entered" as const,
        label: "Nothing due today",
      },
      tasks: [
        {
          stage: "under_contract",
          title: "Sign purchase agreement",
          assigneeRole: "agent",
          status: "open",
          blocksStage: true,
        },
      ] satisfies SeedBuyerTask[],
    },
    {
      clerkId: SEED_CLERK_IDS.buyerG,
      email: "harper.quinn@example.com",
      name: "Harper Quinn",
      phone: "256-555-0107",
      stage: "discovery",
      exception: null,
      inspectionDueOffsetDays: null,
      underContractOffsetDays: null,
      closingAtOffsetDays: null,
      documents: [],
      seedDraftOffer: false,
      prequalStatus: "none" as const,
      property: {
        line1: "55 Gobbs Lane",
        city: "Gurley",
        state: "AL",
        postalCode: "35748",
      },
      owedToday: {
        amountCents: 0,
        currency: "USD" as const,
        provenance: "user_entered" as const,
        label: "Nothing due today",
      },
      tasks: [
        {
          stage: "discovery",
          title: "Share must-haves",
          assigneeRole: "buyer",
          status: "open",
          blocksStage: false,
        },
      ] satisfies SeedBuyerTask[],
    },
    {
      clerkId: SEED_CLERK_IDS.buyerH,
      email: "indira.shah@example.com",
      name: "Indira Shah",
      phone: "256-555-0108",
      stage: "closing",
      exception: null,
      inspectionDueOffsetDays: null,
      underContractOffsetDays: 40,
      closingAtOffsetDays: 21,
      documents: ["purchase_agreement"],
      seedDraftOffer: false,
      prequalStatus: "preapproved" as const,
      property: {
        line1: "8806 Carlton Dr",
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
      tasks: [
        {
          stage: "closing",
          title: "Confirm closing appointment",
          assigneeRole: "buyer",
          status: "open",
          blocksStage: true,
        },
      ] satisfies SeedBuyerTask[],
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

export const COMMAND_CENTER_CLIENT_COUNT = SEED_PLAN.buyers.length;

export const COMMAND_CENTER_EXCEPTION_NAMES = [
  "Dana Ortiz",
  "Ellis Park",
] as const;

export const SEED_CONCIERGE = {
  inspectionStartsAt: Date.UTC(2026, 8, 8, 15, 0, 0),
  showingStartsAt: Date.UTC(2026, 8, 5, 19, 0, 0),
  originalOfferCents: 42000000,
  counterOfferCents: 43000000,
  lenderName: "Jordan Hale",
} as const;

export const SEED_OFFER_AS_OF = Date.UTC(2026, 7, 30, 12, 0, 0);

const DAY_MS = 86_400_000;

function sampleMoney(amountCents: number, label: string) {
  return {
    amountCents,
    currency: "USD" as const,
    provenance: "user_entered" as const,
    asOf: SEED_OFFER_AS_OF,
    label,
  };
}

export const SEED_OFFER_MARKET = {
  sampleLabel: "sample data",
  maple: {
    listPrice: sampleMoney(42500000, "List price · sample data"),
    listedAt: SEED_OFFER_AS_OF - 18 * DAY_MS,
    priceReductions: [
      {
        reducedAt: SEED_OFFER_AS_OF - 6 * DAY_MS,
        previousPrice: sampleMoney(43500000, "Prior list · sample data"),
        newPrice: sampleMoney(42500000, "Reduced list · sample data"),
      },
    ],
    comps: [
      {
        address: {
          line1: "802 Maple Ave",
          city: "Huntsville",
          state: "AL",
          postalCode: "35801",
        },
        soldPrice: sampleMoney(41800000, "Sold comp · sample data"),
        soldDate: SEED_OFFER_AS_OF - 40 * DAY_MS,
        specs: { beds: 3, baths: 2, sqft: 1720 },
        source: "sample data",
      },
      {
        address: {
          line1: "19 Clinton Dr",
          city: "Huntsville",
          state: "AL",
          postalCode: "35801",
        },
        soldPrice: sampleMoney(42900000, "Sold comp · sample data"),
        soldDate: SEED_OFFER_AS_OF - 22 * DAY_MS,
        specs: { beds: 3, baths: 2, sqft: 1880 },
        source: "sample data",
      },
    ],
  },
  cedar: {
    listPrice: sampleMoney(41000000, "List price · sample data"),
    listedAt: SEED_OFFER_AS_OF - 12 * DAY_MS,
    priceReductions: [] as const,
    comps: [
      {
        address: {
          line1: "14 Cedar Trail",
          city: "Madison",
          state: "AL",
          postalCode: "35758",
        },
        soldPrice: sampleMoney(39900000, "Sold comp · sample data"),
        soldDate: SEED_OFFER_AS_OF - 28 * DAY_MS,
        specs: { beds: 3, baths: 2, sqft: 1760 },
        source: "sample data",
      },
      {
        address: {
          line1: "101 Hughes Rd",
          city: "Madison",
          state: "AL",
          postalCode: "35758",
        },
        soldPrice: sampleMoney(41500000, "Sold comp · sample data"),
        soldDate: SEED_OFFER_AS_OF - 15 * DAY_MS,
        specs: { beds: 4, baths: 2, sqft: 2010 },
        source: "sample data",
      },
    ],
  },
  tourListPrices: {
    "seed-listing-oakwood": sampleMoney(38900000, "List price · sample data"),
    "seed-listing-madison": sampleMoney(46500000, "List price · sample data"),
    "seed-listing-harvest": sampleMoney(42900000, "List price · sample data"),
    "seed-listing-decatur": sampleMoney(35500000, "List price · sample data"),
  },
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
      specs: { beds: 3, baths: 2, sqft: 1680, lotAcres: 0.12, garageSpaces: 0 },
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
      specs: { beds: 4, baths: 3, sqft: 2420, lotAcres: 0.18, garageSpaces: 2 },
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
      specs: { beds: 4, baths: 2, sqft: 2100, lotAcres: 0.5, garageSpaces: 2 },
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
      specs: { beds: 3, baths: 2, sqft: 1900, lotAcres: 0.22, garageSpaces: 1 },
      brief: "Decatur craftsman near the river. Longest hop on this loop. Sample listing.",
    },
  ],
} as const;

export const SEED_SEARCH_PROPERTY_IDS = {
  jonesValley: "seed-listing-jones-valley",
  athens: "seed-listing-athens",
  mlsHidden: "seed-listing-mls-hidden",
} as const;

export const SEED_SEARCH = {
  town: SEED_TOUR.origin,
  properties: [
    {
      id: SEED_SEARCH_PROPERTY_IDS.jonesValley,
      address: {
        line1: "109 Valley Wind Dr",
        city: "Owens Cross Roads",
        state: "AL",
        postalCode: "35763",
      },
      coordinates: { lat: 34.5788, lng: -86.5861 },
      specs: { beds: 4, baths: 3, sqft: 2280, lotAcres: 0.6, garageSpaces: 2 },
      brief: "Jones Valley four-bed on over half an acre with a two-car garage. Sample listing.",
      source: "manual" as const,
      listPrice: sampleMoney(41900000, "List price · sample data"),
    },
    {
      id: SEED_SEARCH_PROPERTY_IDS.athens,
      address: {
        line1: "44 Elm Grove Rd",
        city: "Athens",
        state: "AL",
        postalCode: "35611",
      },
      coordinates: { lat: 35.0908, lng: -86.5861 },
      specs: { beds: 4, baths: 2, sqft: 2060, lotAcres: 0.8, garageSpaces: 2 },
      brief: "Athens four-bed with land and a two-car garage. Farther from town. Sample listing.",
      source: "csv" as const,
      listPrice: sampleMoney(43800000, "List price · sample data"),
    },
    {
      id: SEED_SEARCH_PROPERTY_IDS.mlsHidden,
      address: {
        line1: "900 Licensed Feed Ln",
        city: "Huntsville",
        state: "AL",
        postalCode: "35801",
      },
      coordinates: SEED_TOUR.origin.coordinates,
      specs: { beds: 4, baths: 3, sqft: 2500, lotAcres: 1, garageSpaces: 3 },
      brief: "Would come from the licensed feed. Hidden while FLAG_MLS is off.",
      source: "mls" as const,
      mlsId: "VALLEY-MLS-NOT-LIVE",
      listPrice: sampleMoney(39900000, "List price · licensed feed"),
    },
  ],
} as const;

export const SEED_VENDOR_IDS = {
  lender: "seed-vendor-lender",
  inspectorRiley: "seed-vendor-inspector-riley",
  inspectorSam: "seed-vendor-inspector-sam",
  pest: "seed-vendor-pest",
  insurance: "seed-vendor-insurance",
  title: "seed-vendor-title",
  surveyor: "seed-vendor-surveyor",
  hvac: "seed-vendor-hvac",
  plumbing: "seed-vendor-plumbing",
  electrical: "seed-vendor-electrical",
  roofing: "seed-vendor-roofing",
  movers: "seed-vendor-movers",
  locksmith: "seed-vendor-locksmith",
  cleaners: "seed-vendor-cleaners",
  internet: "seed-vendor-internet",
} as const;

export const SEED_ASSIGNMENT_IDS = {
  lenderAlex: "seed-assignment-lender-alex",
} as const;

export const SEED_VENDORS = [
  {
    id: SEED_VENDOR_IDS.lender,
    category: "lenders" as const,
    name: SEED_CONCIERGE.lenderName,
    contact: { email: SEED_PLAN.lender.email, phone: SEED_PLAN.lender.phone },
    notes: "Assigned lender on the Rivera file.",
    credentials: "NMLS sample listing. Not a live origination.",
    clerkId: SEED_CLERK_IDS.lender,
  },
  {
    id: SEED_VENDOR_IDS.inspectorRiley,
    category: "inspectors" as const,
    name: "Riley Brooks",
    contact: { email: "riley.brooks@example.com", phone: "256-555-0140" },
    notes: "Full home inspection, weekday mornings.",
    credentials: "ASHI. Twelve years in north Alabama.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.inspectorSam,
    category: "inspectors" as const,
    name: "Sam Okonkwo",
    contact: { email: "sam.okonkwo@example.com", phone: "256-555-0141" },
    notes: "Same-week slots and a written report the next day.",
    credentials: "InterNACHI. Eight years. Moisture and HVAC add-ons.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.pest,
    category: "pest" as const,
    name: "Pine Wasp Pest",
    contact: { email: "pine.wasp@example.com", phone: "256-555-0142" },
    notes: "WDO letters for purchase contracts.",
    credentials: "Alabama professional permit sample.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.insurance,
    category: "insurance" as const,
    name: "Lookout Binders",
    contact: { email: "binders@example.com", phone: "256-555-0143" },
    notes: "HO-3 quotes. No payment through HomeBase.",
    credentials: "Independent agency sample.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.title,
    category: "title" as const,
    name: "Tennessee Valley Title",
    contact: { email: "tvtitle@example.com", phone: "256-555-0144" },
    notes: "Commitment and closing package.",
    credentials: "Title plant sample.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.surveyor,
    category: "surveyors" as const,
    name: "Redstone Survey",
    contact: { email: "redstone.survey@example.com", phone: "256-555-0145" },
    notes: "Boundary and improvement survey.",
    credentials: "PLS sample.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.hvac,
    category: "hvac" as const,
    name: "Bluff City Air",
    contact: { email: "bluff.air@example.com", phone: "256-555-0146" },
    notes: "Service after inspection findings.",
    credentials: "HVAC contractor sample.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.plumbing,
    category: "plumbing" as const,
    name: "Flint River Plumbing",
    contact: { email: "flint.plumbing@example.com", phone: "256-555-0147" },
    notes: "Leak and sewer scope.",
    credentials: "Plumbing contractor sample.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.electrical,
    category: "electrical" as const,
    name: "Monte Sano Electric",
    contact: { email: "monte.electric@example.com", phone: "256-555-0148" },
    notes: "Panel and fixture work.",
    credentials: "Electrical contractor sample.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.roofing,
    category: "roofing" as const,
    name: "Lookout Roof Co",
    contact: { email: "lookout.roof@example.com", phone: "256-555-0149" },
    notes: "Repair bids from inspection photos.",
    credentials: "Roofing contractor sample.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.movers,
    category: "movers" as const,
    name: "Rocket City Movers",
    contact: { email: "rocket.movers@example.com", phone: "256-555-0150" },
    notes: "Local move-in crew.",
    credentials: "Mover sample.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.locksmith,
    category: "locksmiths" as const,
    name: "Keyhole Lock",
    contact: { email: "keyhole@example.com", phone: "256-555-0151" },
    notes: "Rekey after closing.",
    credentials: "Locksmith sample.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.cleaners,
    category: "cleaners" as const,
    name: "Move-In Shine",
    contact: { email: "shine@example.com", phone: "256-555-0152" },
    notes: "Post-possession clean.",
    credentials: "Cleaner sample.",
    clerkId: null,
  },
  {
    id: SEED_VENDOR_IDS.internet,
    category: "internet" as const,
    name: "Valley Fiber Desk",
    contact: { email: "valley.fiber@example.com", phone: "256-555-0153" },
    notes: "Install scheduling only.",
    credentials: "ISP desk sample.",
    clerkId: null,
  },
] as const;
