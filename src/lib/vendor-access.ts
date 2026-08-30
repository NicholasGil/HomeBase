import { categoriesForStage } from "../../convex/lib/vendors";
import {
  SEED_ASSIGNMENT_IDS,
  SEED_CLERK_IDS,
  SEED_PLAN,
} from "../../convex/seedPlan";
import {
  seedLenderAssignment,
  seedLenderVendor,
  seedVendorById,
  seedVendorsForStage,
  type ListedSeedVendor,
} from "@/lib/seed-vendors";
import type { TestSession } from "@/lib/test-session";

export const VENDOR_PORTAL_COOKIE = "hb_vendor_portal";
export const VENDOR_EXPIRY_COOKIE = "hb_vendor_expiry";

export type FixtureVendorMessage = {
  id: string;
  body: string;
  at: number;
  authorName: string;
};

export type FixtureVendorPortalState = {
  messages: FixtureVendorMessage[];
  documentRequests: { id: string; documentType: string }[];
  uploads: { id: string; type: string }[];
  requestedVendorIds: string[];
  completed: boolean;
};

export function emptyVendorPortalState(): FixtureVendorPortalState {
  return {
    messages: [],
    documentRequests: [],
    uploads: [],
    requestedVendorIds: [],
    completed: false,
  };
}

export function parseVendorPortalState(
  value: string | undefined,
): FixtureVendorPortalState {
  if (value === undefined || value.length === 0) {
    return emptyVendorPortalState();
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null) {
      return emptyVendorPortalState();
    }
    const row = parsed as Partial<FixtureVendorPortalState>;
    return {
      messages: Array.isArray(row.messages) ? row.messages : [],
      documentRequests: Array.isArray(row.documentRequests)
        ? row.documentRequests
        : [],
      uploads: Array.isArray(row.uploads) ? row.uploads : [],
      requestedVendorIds: Array.isArray(row.requestedVendorIds)
        ? row.requestedVendorIds
        : [],
      completed: row.completed === true,
    };
  } catch {
    return emptyVendorPortalState();
  }
}

function buyerStage(session: TestSession) {
  if (session.role !== "buyer") {
    return null;
  }
  const buyer = SEED_PLAN.buyers.find((row) => row.clerkId === session.clerkId);
  return buyer?.stage ?? null;
}

export function loadSeedDirectoryForViewer(
  session: TestSession | null,
  transactionId: string,
) {
  if (session === null) {
    return { ok: false as const, reason: "UNAUTHENTICATED" as const };
  }
  if (session.role !== "buyer" || session.transactionId !== transactionId) {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  const stage = buyerStage(session);
  if (stage === null) {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  return {
    ok: true as const,
    stage,
    categories: categoriesForStage(stage),
    vendors: seedVendorsForStage(stage),
  };
}

export function compareSeedVendorsForViewer(
  session: TestSession | null,
  transactionId: string,
  vendorIds: string[],
) {
  const directory = loadSeedDirectoryForViewer(session, transactionId);
  if (!directory.ok) {
    return directory;
  }
  const vendors: ListedSeedVendor[] = [];
  for (const vendorId of vendorIds) {
    const vendor = seedVendorById(vendorId);
    if (vendor === null) {
      return { ok: false as const, reason: "FORBIDDEN" as const };
    }
    vendors.push(vendor);
  }
  return { ok: true as const, vendors };
}

export function requestSeedAppointmentForViewer(
  session: TestSession | null,
  input: { transactionId: string; vendorId: string },
  state: FixtureVendorPortalState,
) {
  const directory = loadSeedDirectoryForViewer(session, input.transactionId);
  if (!directory.ok) {
    return directory;
  }
  if (seedVendorById(input.vendorId) === null) {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  return {
    ok: true as const,
    state: {
      ...state,
      requestedVendorIds: [...state.requestedVendorIds, input.vendorId],
    },
  };
}

function assignmentIsLive(input: {
  session: TestSession;
  expired: boolean;
  completed: boolean;
}) {
  return (
    input.session.role === "vendor" &&
    input.session.clerkId === SEED_CLERK_IDS.lender &&
    !input.expired &&
    !input.completed
  );
}

export function loadSeedPortalForViewer(
  session: TestSession | null,
  input: { expired: boolean; state: FixtureVendorPortalState },
) {
  if (session === null) {
    return { ok: false as const, reason: "UNAUTHENTICATED" as const };
  }
  if (session.role !== "vendor") {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  if (!assignmentIsLive({ session, expired: input.expired, completed: false })) {
    return {
      ok: true as const,
      vendor: seedLenderVendor(),
      assignments: [],
      state: input.state,
      expired: input.expired,
    };
  }
  if (input.state.completed || input.expired) {
    return {
      ok: true as const,
      vendor: seedLenderVendor(),
      assignments: [],
      state: input.state,
      expired: input.expired,
    };
  }
  return {
    ok: true as const,
    vendor: seedLenderVendor(),
    assignments: [seedLenderAssignment()],
    state: input.state,
    expired: false,
  };
}

export function loadSeedAssignmentForViewer(
  session: TestSession | null,
  assignmentId: string,
  input: { expired: boolean; state: FixtureVendorPortalState },
) {
  const portal = loadSeedPortalForViewer(session, input);
  if (!portal.ok) {
    return portal;
  }
  const assignment = portal.assignments.find(
    (row) => row.assignmentId === assignmentId,
  );
  if (assignment === undefined) {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  return { ok: true as const, assignment, state: portal.state };
}

export function sendSeedVendorMessage(
  session: TestSession | null,
  input: { assignmentId: string; body: string; expired: boolean },
  state: FixtureVendorPortalState,
) {
  const loaded = loadSeedAssignmentForViewer(session, input.assignmentId, {
    expired: input.expired,
    state,
  });
  if (!loaded.ok) {
    return loaded;
  }
  const body = input.body.trim();
  if (body.length === 0 || session === null) {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  return {
    ok: true as const,
    state: {
      ...state,
      messages: [
        ...state.messages,
        {
          id: `msg:${Date.now()}`,
          body,
          at: Date.now(),
          authorName: session.name,
        },
      ],
    },
  };
}

export function requestSeedVendorDocument(
  session: TestSession | null,
  input: { assignmentId: string; documentType: string; expired: boolean },
  state: FixtureVendorPortalState,
) {
  const loaded = loadSeedAssignmentForViewer(session, input.assignmentId, {
    expired: input.expired,
    state,
  });
  if (!loaded.ok) {
    return loaded;
  }
  return {
    ok: true as const,
    state: {
      ...state,
      documentRequests: [
        ...state.documentRequests,
        { id: `req:${Date.now()}`, documentType: input.documentType },
      ],
    },
  };
}

export function uploadSeedVendorWorkProduct(
  session: TestSession | null,
  input: { assignmentId: string; kind: "report" | "invoice"; expired: boolean },
  state: FixtureVendorPortalState,
) {
  const loaded = loadSeedAssignmentForViewer(session, input.assignmentId, {
    expired: input.expired,
    state,
  });
  if (!loaded.ok) {
    return loaded;
  }
  return {
    ok: true as const,
    state: {
      ...state,
      uploads: [
        ...state.uploads,
        {
          id: `upload:${Date.now()}`,
          type: input.kind === "invoice" ? "invoice" : "inspection_report",
        },
      ],
    },
  };
}

export function markSeedAssignmentComplete(
  session: TestSession | null,
  input: { assignmentId: string; expired: boolean },
  state: FixtureVendorPortalState,
) {
  const loaded = loadSeedAssignmentForViewer(session, input.assignmentId, {
    expired: input.expired,
    state,
  });
  if (!loaded.ok) {
    return loaded;
  }
  return { ok: true as const, state: { ...state, completed: true } };
}

export function writeFixtureCompensation(compensationModel: string) {
  if (compensationModel === "none") {
    return { ok: true as const, compensationModel: "none" as const };
  }
  return { ok: false as const, reason: "FORBIDDEN" as const };
}

export function scheduleSeedVendor(
  session: TestSession | null,
  input: { assignmentId: string; expired: boolean },
  state: FixtureVendorPortalState,
) {
  const loaded = loadSeedAssignmentForViewer(session, input.assignmentId, {
    expired: input.expired,
    state,
  });
  if (!loaded.ok) {
    return loaded;
  }
  return { ok: true as const, state };
}

export { SEED_ASSIGNMENT_IDS };
