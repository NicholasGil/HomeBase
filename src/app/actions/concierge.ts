"use server";

import { completeConcierge } from "../../../lib/llm";
import { getTestSession } from "@/app/actions/test-session";
import { conciergeFactsForCoach } from "@/lib/concierge-facts-for-coach";
import { clerkBuyerConciergeFacts } from "@/lib/concierge-clerk-buyer";
import { isClerkConfigured } from "@/lib/auth-config";
import { OTHER_CLIENT_NAMES } from "@/lib/seed-concierge";

export async function askConcierge(input: { question: string }) {
  const session = await getTestSession();

  if (session !== null && session.role !== "buyer") {
    return { ok: false as const, reason: "FORBIDDEN" as const };
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
    const answer = completeConcierge({
      question: input.question,
      facts: clerk.facts,
      otherClientNames: OTHER_CLIENT_NAMES,
    });
    return { ok: true as const, answer };
  }

  return { ok: false as const, reason: "UNAUTHENTICATED" as const };
}

/** @deprecated Use askConcierge */
export async function askSeedConcierge(input: { question: string }) {
  return askConcierge(input);
}
