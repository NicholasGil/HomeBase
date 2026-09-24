"use server";

import { completeConcierge, conciergeModelKeyPresent } from "../../../lib/llm";
import { getTestSession } from "@/app/actions/test-session";
import { conciergeFactsForCoach } from "@/lib/concierge-facts-for-coach";
import { clerkBuyerConciergeFacts } from "@/lib/concierge-clerk-buyer";
import { isClerkConfigured } from "@/lib/auth-config";
import {
  conciergeAvailability,
  type ConciergeAvailability,
} from "@/lib/concierge-availability";
import { OTHER_CLIENT_NAMES } from "@/lib/seed-concierge";

export type ConciergeAskFailureReason =
  | "FORBIDDEN"
  | "UNAUTHENTICATED"
  | "MODEL_KEY_NOT_CONFIGURED";

export async function getConciergeAvailability(): Promise<ConciergeAvailability> {
  const session = await getTestSession();
  return conciergeAvailability(session, process.env);
}

export async function askConcierge(input: { question: string }) {
  const session = await getTestSession();

  if (session !== null && session.role !== "buyer") {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }

  if (
    conciergeAvailability(session, process.env) === "model_key_missing"
  ) {
    return {
      ok: false as const,
      reason: "MODEL_KEY_NOT_CONFIGURED" as const,
    };
  }

  if (session?.role === "buyer") {
    const facts = conciergeFactsForCoach(session);
    const answer = completeConcierge({
      question: input.question,
      facts,
      otherClientNames: OTHER_CLIENT_NAMES,
    });
    return { ok: true as const, answer };
  }

  if (isClerkConfigured()) {
    const clerk = await clerkBuyerConciergeFacts();
    if (clerk === null) {
      return { ok: false as const, reason: "UNAUTHENTICATED" as const };
    }
    if (!clerk.ok) {
      return { ok: false as const, reason: clerk.reason };
    }
    if (!conciergeModelKeyPresent()) {
      return {
        ok: false as const,
        reason: "MODEL_KEY_NOT_CONFIGURED" as const,
      };
    }
    const answer = completeConcierge({
      question: input.question,
      facts: clerk.facts,
      otherClientNames: OTHER_CLIENT_NAMES,
      requireModelKey: true,
    });
    return { ok: true as const, answer };
  }

  return { ok: false as const, reason: "UNAUTHENTICATED" as const };
}

/** @deprecated Use askConcierge */
export async function askSeedConcierge(input: { question: string }) {
  return askConcierge(input);
}
