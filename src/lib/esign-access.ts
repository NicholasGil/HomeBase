import { explainAllSections } from "../../convex/lib/explainContract";
import {
  ESIGN_NOT_ENABLED,
  SIGNATURE_FLOW,
  type SignatureFlowStatus,
} from "../../convex/lib/esign";
import { getFeatureFlags } from "@/lib/flags";
import { SEED_TRANSACTION_IDS, type TestSession } from "@/lib/test-session";

export const FIXTURE_ESIGN_COOKIE = "hb_fixture_esign";

export const FIXTURE_PACKET_ID = "seed:packet-a";
export const FIXTURE_SIGN_DOCUMENT_ID = "seed:doc-purchase-agreement";

export type FixturePacket = {
  id: string;
  transactionId: string;
  documentId: string;
  documentType: string;
  status: SignatureFlowStatus;
  designated: boolean;
  explainedSectionIds: string[];
  agentReviewedById: string | null;
  buyerReviewedById: string | null;
  providerRef: string | null;
};

export type FixtureEsignState = {
  packets: FixturePacket[];
};

export function defaultFixturePackets(transactionId: string): FixturePacket[] {
  return [
    {
      id: FIXTURE_PACKET_ID,
      transactionId,
      documentId: FIXTURE_SIGN_DOCUMENT_ID,
      documentType: "purchase_agreement",
      status: "prepare",
      designated: true,
      explainedSectionIds: [],
      agentReviewedById: null,
      buyerReviewedById: null,
      providerRef: null,
    },
  ];
}

export function parseFixtureEsign(value: string | undefined): FixtureEsignState {
  if (value === undefined || value.length === 0) {
    return { packets: [] };
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || !("packets" in parsed)) {
      return { packets: [] };
    }
    const packets = (parsed as { packets: unknown }).packets;
    if (!Array.isArray(packets)) {
      return { packets: [] };
    }
    return { packets: packets as FixturePacket[] };
  } catch {
    return { packets: [] };
  }
}

function packetsForSession(
  session: TestSession,
  state: FixtureEsignState,
): FixturePacket[] {
  if (session.role !== "buyer") {
    return state.packets.length > 0
      ? state.packets
      : defaultFixturePackets(SEED_TRANSACTION_IDS.clerk_buyer_a);
  }
  if (state.packets.length > 0) {
    return state.packets.filter(
      (packet) => packet.transactionId === session.transactionId,
    );
  }
  return defaultFixturePackets(session.transactionId);
}

export function loadFixtureEsign(input: {
  session: TestSession | null;
  state: FixtureEsignState;
}):
  | {
      ok: true;
      packets: FixturePacket[];
      sections: ReturnType<typeof explainAllSections>;
      flow: typeof SIGNATURE_FLOW;
      flagOn: boolean;
    }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  if (input.session === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (input.session.role === "vendor") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return {
    ok: true,
    packets: packetsForSession(input.session, input.state),
    sections: explainAllSections(),
    flow: SIGNATURE_FLOW,
    flagOn: getFeatureFlags().FLAG_ESIGN,
  };
}

export function sendFixturePacket(input: {
  session: TestSession | null;
}):
  | { ok: true; providerRef: string }
  | {
      ok: false;
      reason: "UNAUTHENTICATED" | "FORBIDDEN" | typeof ESIGN_NOT_ENABLED;
    } {
  if (input.session === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (input.session.role === "vendor") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (!getFeatureFlags().FLAG_ESIGN) {
    return { ok: false, reason: ESIGN_NOT_ENABLED };
  }
  return { ok: false, reason: ESIGN_NOT_ENABLED };
}

export function signFixturePacket(input: {
  session: TestSession | null;
}):
  | { ok: true }
  | {
      ok: false;
      reason: "UNAUTHENTICATED" | "FORBIDDEN" | typeof ESIGN_NOT_ENABLED;
    } {
  if (input.session === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (input.session.role !== "buyer") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (!getFeatureFlags().FLAG_ESIGN) {
    return { ok: false, reason: ESIGN_NOT_ENABLED };
  }
  return { ok: false, reason: ESIGN_NOT_ENABLED };
}
