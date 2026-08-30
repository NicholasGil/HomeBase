import { assertCompensationModelWrite } from "../../convex/lib/vendors";
import { DEFAULT_FEATURE_FLAGS } from "../../convex/lib/validators";
import type { HomeownershipHubView } from "../../convex/lib/homeownership";
import { SEED_CLERK_IDS, seedTransactionStatus } from "../../convex/seedPlan";
import {
  applyReengage,
  SEED_CLOSED_TRANSACTION_ID,
  seedHomeownershipHub,
} from "@/lib/seed-homeownership";
import type { TestSession } from "@/lib/test-session";

export type HubLoadResult =
  | { ok: true; view: HomeownershipHubView }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" };

export function loadSeedHubForViewer(
  session: TestSession | null,
  transactionId: string,
  reengagedVendorIds: readonly string[] = [],
): HubLoadResult {
  if (session === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (session.role !== "buyer" || session.transactionId !== transactionId) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (session.clerkId !== SEED_CLERK_IDS.buyerH) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (transactionId !== SEED_CLOSED_TRANSACTION_ID) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  let view = seedHomeownershipHub();
  for (const vendorId of reengagedVendorIds) {
    view = applyReengage(view, vendorId);
  }
  return { ok: true, view };
}

export function reengageSeedVendorForViewer(
  session: TestSession | null,
  input: {
    transactionId: string;
    vendorId: string;
    compensationModel?: string;
  },
  reengagedVendorIds: readonly string[],
):
  | { ok: true; view: HomeownershipHubView; compensationModel: "none" }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  if (input.compensationModel !== undefined) {
    try {
      assertCompensationModelWrite(
        DEFAULT_FEATURE_FLAGS,
        input.compensationModel,
      );
    } catch {
      return { ok: false, reason: "FORBIDDEN" };
    }
  }
  const loaded = loadSeedHubForViewer(
    session,
    input.transactionId,
    reengagedVendorIds,
  );
  if (!loaded.ok) {
    return loaded;
  }
  const vendor = loaded.view.vendors.find(
    (row) => row.vendorId === input.vendorId,
  );
  if (vendor === undefined) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return {
    ok: true,
    view: applyReengage(loaded.view, input.vendorId),
    compensationModel: "none",
  };
}

export function buyerHubPath(session: TestSession) {
  if (session.role !== "buyer") {
    return null;
  }
  return `/homeownership/${session.transactionId}`;
}

export function fixtureBuyerIsClosed(session: TestSession) {
  if (session.role !== "buyer") {
    return false;
  }
  return session.clerkId === SEED_CLERK_IDS.buyerH;
}

export { seedTransactionStatus };
